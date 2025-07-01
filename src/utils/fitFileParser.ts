
interface FitRecord {
  timestamp?: number;
  power?: number;
  cadence?: number;
  [key: string]: any;
}

interface ParsedFitData {
  records: FitRecord[];
  duration: number;
}

// FIT Epoch: December 31, 1989 00:00:00 UTC
const FIT_EPOCH = new Date('1989-12-31T00:00:00Z').getTime() / 1000;

export const parseFitFile = async (file: File): Promise<ParsedFitData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        const dataView = new DataView(arrayBuffer);
        
        console.log('Processing FIT file:', file.name, 'Size:', arrayBuffer.byteLength);
        
        // Validate minimum file size
        if (arrayBuffer.byteLength < 14) {
          throw new Error('File too small to be a valid FIT file');
        }
        
        // Read FIT header
        const headerSize = dataView.getUint8(0);
        const protocolVersion = dataView.getUint8(1);
        const profileVersion = dataView.getUint16(2, true);
        const dataSize = dataView.getUint32(4, true);
        
        // Verify FIT signature
        const signature = new TextDecoder().decode(arrayBuffer.slice(8, 12));
        console.log('FIT signature:', signature);
        
        if (signature !== '.FIT') {
          throw new Error('Invalid FIT file - missing .FIT signature');
        }
        
        console.log('FIT Header valid:', { headerSize, protocolVersion, profileVersion, dataSize });
        
        const records: FitRecord[] = [];
        let offset = headerSize;
        const endOffset = Math.min(headerSize + dataSize, arrayBuffer.byteLength - 2);
        
        // More systematic approach to find record data
        while (offset < endOffset) {
          try {
            // Look for record header byte
            const recordHeader = dataView.getUint8(offset);
            
            // Check if this might be a normal record (bit 7 = 0)
            if ((recordHeader & 0x80) === 0) {
              const record = parseRecord(dataView, offset);
              if (record && record.power && record.power > 0) {
                records.push(record);
              }
            }
            
            offset += 1;
          } catch (e) {
            offset += 1;
          }
          
          if (offset >= arrayBuffer.byteLength - 20) break;
          if (records.length > 50000) break; // Safety limit
        }
        
        console.log(`Extracted ${records.length} records from FIT file`);
        
        if (records.length === 0) {
          throw new Error('No valid power data found in FIT file');
        }
        
        // Sort records by timestamp
        const sortedRecords = records.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
        
        // Calculate duration from timestamps
        const firstTimestamp = sortedRecords[0].timestamp || 0;
        const lastTimestamp = sortedRecords[sortedRecords.length - 1].timestamp || 0;
        const duration = lastTimestamp - firstTimestamp;
        
        console.log('FIT parsing complete:', { 
          recordCount: sortedRecords.length, 
          duration,
          firstTimestamp,
          lastTimestamp,
          firstFitTimestamp: firstTimestamp,
          lastFitTimestamp: lastTimestamp,
          sampleData: sortedRecords.slice(0, 3)
        });
        
        resolve({
          records: sortedRecords,
          duration
        });
        
      } catch (error) {
        console.error('Error parsing FIT file:', error);
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
};

function parseRecord(dataView: DataView, offset: number): FitRecord | null {
  try {
    if (offset + 20 > dataView.byteLength) return null;
    
    let power: number | undefined;
    let cadence: number | undefined;
    let timestamp: number | undefined;
    
    // Look for FIT timestamp (32-bit values)
    // FIT timestamps are seconds since December 31, 1989
    // Recent FIT files should have timestamps > 1,000,000,000 (from FIT epoch)
    for (let i = 0; i <= 16; i += 4) {
      if (offset + i + 3 >= dataView.byteLength) break;
      
      const value32 = dataView.getUint32(offset + i, true);
      // FIT timestamps should be reasonable values from FIT epoch
      if (value32 > 1000000000 && value32 < 2000000000 && !timestamp) {
        timestamp = value32;
      }
    }
    
    // Look for power values (16-bit, typically 0-2000 watts)
    for (let i = 0; i < 16; i += 2) {
      if (offset + i + 1 >= dataView.byteLength) break;
      
      const value16 = dataView.getUint16(offset + i, true);
      if (value16 > 0 && value16 <= 2000 && !power) {
        power = value16;
      }
    }
    
    // Look for cadence values (8-bit, typically 0-200 rpm)
    for (let i = 0; i < 20; i++) {
      if (offset + i >= dataView.byteLength) break;
      
      const value8 = dataView.getUint8(offset + i);
      if (value8 > 0 && value8 <= 200 && !cadence) {
        cadence = value8;
      }
    }
    
    // Return record if we found power data
    if (power !== undefined && power > 0) {
      return {
        timestamp,
        power,
        cadence
      };
    }
    
    return null;
  } catch (e) {
    return null;
  }
}

// Convert FIT timestamp to JavaScript Date
export const fitTimestampToDate = (fitTimestamp: number): Date => {
  // FIT timestamps are seconds since December 31, 1989 00:00:00 UTC
  const unixTimestamp = fitTimestamp + FIT_EPOCH;
  return new Date(unixTimestamp * 1000);
};
