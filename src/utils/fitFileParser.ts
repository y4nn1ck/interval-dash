
interface FitRecord {
  timestamp?: number;
  power?: number;
  cadence?: number;
  [key: string]: any;
}

interface ParsedFitData {
  records: FitRecord[];
  duration: number; // in seconds
}

interface FitDefinition {
  localMessageType: number;
  globalMessageNumber: number;
  fields: Array<{
    fieldDefNum: number;
    size: number;
    baseType: number;
  }>;
}

export const parseFitFile = async (file: File): Promise<ParsedFitData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        const dataView = new DataView(arrayBuffer);
        
        console.log('FIT file size:', arrayBuffer.byteLength);
        
        // Check FIT file header (14 bytes)
        if (arrayBuffer.byteLength < 14) {
          throw new Error('File too small to be a valid FIT file');
        }
        
        const headerSize = dataView.getUint8(0);
        const protocolVersion = dataView.getUint8(1);
        const profileVersion = dataView.getUint16(2, true);
        const dataSize = dataView.getUint32(4, true);
        
        // Check for FIT signature '.FIT'
        const signature = String.fromCharCode(
          dataView.getUint8(8),
          dataView.getUint8(9),
          dataView.getUint8(10),
          dataView.getUint8(11)
        );
        
        console.log('FIT Header:', { headerSize, protocolVersion, profileVersion, dataSize, signature });
        
        if (signature !== '.FIT') {
          throw new Error('Invalid FIT file signature');
        }
        
        const records: FitRecord[] = [];
        const definitions: Map<number, FitDefinition> = new Map();
        let offset = headerSize; // Start after header
        let startTimestamp: number | null = null;
        
        while (offset < headerSize + dataSize) {
          if (offset >= arrayBuffer.byteLength) break;
          
          const recordHeader = dataView.getUint8(offset);
          offset++;
          
          console.log(`Processing record at offset ${offset - 1}, header: 0x${recordHeader.toString(16)}`);
          
          if (recordHeader & 0x80) {
            // Compressed timestamp header
            const timeOffset = recordHeader & 0x1F;
            const localMessageType = (recordHeader >> 5) & 0x3;
            
            console.log('Compressed timestamp record:', { timeOffset, localMessageType });
            
            const definition = definitions.get(localMessageType);
            if (definition) {
              const record = parseDataMessage(dataView, offset, definition);
              if (record && startTimestamp !== null) {
                record.timestamp = startTimestamp + timeOffset;
                records.push(record);
              }
              offset += getMessageSize(definition);
            }
          } else {
            // Normal record header
            const messageType = recordHeader & 0x0F;
            const localMessageType = (recordHeader >> 4) & 0x0F;
            
            console.log('Normal record:', { messageType, localMessageType });
            
            if (messageType === 1) {
              // Definition message
              const definition = parseDefinitionMessage(dataView, offset);
              definitions.set(localMessageType, definition);
              offset += getDefinitionMessageSize(dataView, offset);
              
              console.log('Definition message parsed:', definition);
            } else if (messageType === 0) {
              // Data message
              const definition = definitions.get(localMessageType);
              if (definition) {
                const record = parseDataMessage(dataView, offset, definition);
                if (record) {
                  if (startTimestamp === null && record.timestamp) {
                    startTimestamp = record.timestamp;
                  }
                  records.push(record);
                }
                offset += getMessageSize(definition);
              } else {
                console.log('No definition found for local message type:', localMessageType);
                offset++;
              }
            } else {
              offset++;
            }
          }
        }
        
        console.log(`Parsed ${records.length} records from FIT file`);
        
        if (records.length === 0) {
          throw new Error('No valid records found in FIT file');
        }
        
        // Calculate duration from timestamps
        const validTimestamps = records
          .map(r => r.timestamp)
          .filter(t => t !== undefined) as number[];
        
        const duration = validTimestamps.length > 1 
          ? Math.max(...validTimestamps) - Math.min(...validTimestamps)
          : records.length;
        
        console.log('FIT file parsing completed:', { recordCount: records.length, duration });
        
        resolve({
          records,
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

function parseDefinitionMessage(dataView: DataView, offset: number): FitDefinition {
  const reserved = dataView.getUint8(offset);
  const architecture = dataView.getUint8(offset + 1);
  const globalMessageNumber = dataView.getUint16(offset + 2, architecture === 0);
  const numFields = dataView.getUint8(offset + 4);
  
  const fields = [];
  let fieldOffset = offset + 5;
  
  for (let i = 0; i < numFields; i++) {
    fields.push({
      fieldDefNum: dataView.getUint8(fieldOffset),
      size: dataView.getUint8(fieldOffset + 1),
      baseType: dataView.getUint8(fieldOffset + 2)
    });
    fieldOffset += 3;
  }
  
  return {
    localMessageType: 0, // Will be set by caller
    globalMessageNumber,
    fields
  };
}

function getDefinitionMessageSize(dataView: DataView, offset: number): number {
  const numFields = dataView.getUint8(offset + 4);
  return 5 + (numFields * 3);
}

function parseDataMessage(dataView: DataView, offset: number, definition: FitDefinition): FitRecord | null {
  const record: FitRecord = {};
  let fieldOffset = offset;
  
  for (const field of definition.fields) {
    try {
      let value: number | undefined;
      
      // Parse based on field size and type
      if (field.size === 1) {
        value = dataView.getUint8(fieldOffset);
      } else if (field.size === 2) {
        value = dataView.getUint16(fieldOffset, true);
      } else if (field.size === 4) {
        value = dataView.getUint32(fieldOffset, true);
      }
      
      // Map field definition numbers to known fields
      // These are based on the FIT SDK field definitions
      if (definition.globalMessageNumber === 20) { // Record message
        switch (field.fieldDefNum) {
          case 253: // timestamp
            if (value && value !== 0xFFFFFFFF) {
              record.timestamp = value;
            }
            break;
          case 7: // power
            if (value && value !== 0xFFFF && value < 2000) {
              record.power = value;
            }
            break;
          case 3: // cadence
            if (value && value !== 0xFF && value < 200) {
              record.cadence = value;
            }
            break;
        }
      }
      
      fieldOffset += field.size;
    } catch (e) {
      console.log('Error parsing field:', e);
      fieldOffset += field.size;
    }
  }
  
  // Only return record if it has meaningful data
  if (record.timestamp || record.power || record.cadence) {
    return record;
  }
  
  return null;
}

function getMessageSize(definition: FitDefinition): number {
  return definition.fields.reduce((sum, field) => sum + field.size, 0);
}
