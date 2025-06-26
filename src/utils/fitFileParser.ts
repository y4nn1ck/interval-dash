
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
        
        let recordCounter = 0;
        let baseTimestamp: number | null = null;
        
        // Parse records with improved time handling
        while (offset < endOffset && recordCounter < 10000) { // Safety limit
          try {
            const record = extractRecordData(dataView, offset, recordCounter);
            if (record) {
              // Set base timestamp from first valid record
              if (baseTimestamp === null && record.timestamp) {
                baseTimestamp = record.timestamp;
                console.log('Base timestamp set to:', baseTimestamp);
              }
              
              // Convert timestamp to relative seconds
              if (record.timestamp && baseTimestamp) {
                record.timestamp = record.timestamp - baseTimestamp;
              } else if (!record.timestamp) {
                // Use record counter as fallback timestamp (assuming 1Hz recording)
                record.timestamp = recordCounter;
              }
              
              records.push(record);
              recordCounter++;
            }
            offset += 12; // Move to next potential record
          } catch (e) {
            offset += 1;
          }
          
          if (offset >= arrayBuffer.byteLength - 20) break;
        }
        
        console.log(`Extracted ${records.length} records from FIT file`);
        
        // Filter out invalid records and sort by timestamp
        const validRecords = records
          .filter(record => record.power !== undefined && record.power > 0 && record.power < 2000)
          .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
        
        console.log(`Filtered to ${validRecords.length} valid records`);
        
        if (validRecords.length === 0) {
          throw new Error('No valid power data found in FIT file');
        }
        
        // Calculate actual duration from timestamps
        const firstTimestamp = validRecords[0].timestamp || 0;
        const lastTimestamp = validRecords[validRecords.length - 1].timestamp || validRecords.length;
        const duration = lastTimestamp - firstTimestamp;
        
        console.log('FIT parsing complete:', { 
          recordCount: validRecords.length, 
          duration,
          firstTimestamp,
          lastTimestamp,
          sampleData: validRecords.slice(0, 3)
        });
        
        resolve({
          records: validRecords,
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

function extractRecordData(dataView: DataView, offset: number, recordIndex: number): FitRecord | null {
  try {
    if (offset + 20 > dataView.byteLength) return null;
    
    let power: number | undefined;
    let cadence: number | undefined;
    let timestamp: number | undefined;
    
    // Look for timestamp (32-bit values)
    for (let i = 0; i <= 16; i += 4) {
      if (offset + i + 3 >= dataView.byteLength) break;
      
      const value32 = dataView.getUint32(offset + i, true);
      // FIT timestamps are seconds since UTC 00:00 Dec 31 1989
      // They should be large values (> 631065600 which is Jan 1 2010)
      if (value32 > 631065600 && value32 < 2147483647 && !timestamp) {
        timestamp = value32;
      }
    }
    
    // Look for power and cadence (16-bit and 8-bit values)
    for (let i = 0; i < 16; i += 2) {
      if (offset + i + 1 >= dataView.byteLength) break;
      
      const value16 = dataView.getUint16(offset + i, true);
      const value8 = dataView.getUint8(offset + i);
      
      // Power values (typically 0-1000 watts)
      if (value16 >= 0 && value16 <= 1000 && !power) {
        power = value16;
      }
      
      // Cadence values (typically 0-150 rpm)
      if (value8 >= 0 && value8 <= 150 && !cadence) {
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
