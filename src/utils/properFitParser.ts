
import FitParser from 'fit-file-parser';

interface FitRecord {
  timestamp?: number;
  power?: number;
  cadence?: number;
  heart_rate?: number;
  speed?: number;
  distance?: number;
  altitude?: number;
  temperature?: number;
  elapsed_time?: number;
  [key: string]: any;
}

interface ParsedFitData {
  records: FitRecord[];
  sessions: any[];
  laps: any[];
  duration: number;
  device_info?: any;
  file_info?: any;
  rawDataStructure?: any;
}

const extractTimestamp = (timestampData: any): number | undefined => {
  if (!timestampData) return undefined;
  
  // Handle direct ISO string format (like "2025-07-01T16:03:24.000Z")
  if (typeof timestampData === 'string') {
    return new Date(timestampData).getTime();
  }
  
  // Handle direct Date object
  if (timestampData instanceof Date) {
    return timestampData.getTime();
  }
  
  // Handle direct number (Unix timestamp)
  if (typeof timestampData === 'number') {
    return timestampData;
  }
  
  return undefined;
};

export const parseProperFitFile = async (file: File): Promise<ParsedFitData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        console.log('Processing FIT file with proper parser:', file.name, 'Size:', arrayBuffer.byteLength);
        
        const fitParser = new FitParser({
          force: true,
          speedUnit: 'km/h',
          lengthUnit: 'm',
          temperatureUnit: 'celsius',
          elapsedRecordField: true,
          mode: 'cascade',
        });

        fitParser.parse(arrayBuffer, (error: any, data: any) => {
          if (error) {
            console.error('FIT parsing error:', error);
            reject(new Error(`Failed to parse FIT file: ${error.message}`));
            return;
          }

          console.log('=== FIT DATA STRUCTURE DEBUG ===');
          console.log('Full parsed data keys:', Object.keys(data));
          
          const records: FitRecord[] = [];

          // Direct access to activity.records where the actual workout data is
          if (data.activity && data.activity.records && Array.isArray(data.activity.records)) {
            console.log(`Found activity.records with ${data.activity.records.length} workout records`);
            
            data.activity.records.forEach((record: any, index: number) => {
              if (record && typeof record === 'object') {
                // Direct extraction of values with proper timestamp handling
                const extractedRecord: FitRecord = {};
                
                // Handle timestamp with improved extraction
                const extractedTimestamp = extractTimestamp(record.timestamp);
                if (extractedTimestamp) {
                  extractedRecord.timestamp = extractedTimestamp;
                }
                
                // Extract all numeric values directly
                if (typeof record.power === 'number') extractedRecord.power = record.power;
                if (typeof record.cadence === 'number') extractedRecord.cadence = record.cadence;
                if (typeof record.heart_rate === 'number') extractedRecord.heart_rate = record.heart_rate;
                if (typeof record.speed === 'number') extractedRecord.speed = record.speed;
                if (typeof record.distance === 'number') extractedRecord.distance = record.distance;
                if (typeof record.altitude === 'number') extractedRecord.altitude = record.altitude;
                if (typeof record.temperature === 'number') extractedRecord.temperature = record.temperature;
                if (typeof record.elapsed_time === 'number') extractedRecord.elapsed_time = record.elapsed_time;
                
                records.push(extractedRecord);
                
                // Log first few records for debugging
                if (index < 3) {
                  console.log(`Record ${index}:`, {
                    timestamp: extractedRecord.timestamp,
                    power: extractedRecord.power,
                    cadence: extractedRecord.cadence,
                    heart_rate: extractedRecord.heart_rate,
                    elapsed_time: extractedRecord.elapsed_time,
                    originalRecord: record
                  });
                }
              }
            });
          } else {
            console.log('No activity.records found, trying fallback locations...');
            
            // Fallback: direct records array
            if (data.records && Array.isArray(data.records)) {
              console.log(`Found data.records with ${data.records.length} items`);
              data.records.forEach((record: any) => {
                if (record && typeof record === 'object') {
                  const extractedRecord: FitRecord = {};
                  
                  const extractedTimestamp = extractTimestamp(record.timestamp);
                  if (extractedTimestamp) {
                    extractedRecord.timestamp = extractedTimestamp;
                  }
                  
                  if (typeof record.power === 'number') extractedRecord.power = record.power;
                  if (typeof record.cadence === 'number') extractedRecord.cadence = record.cadence;
                  if (typeof record.heart_rate === 'number') extractedRecord.heart_rate = record.heart_rate;
                  if (typeof record.speed === 'number') extractedRecord.speed = record.speed;
                  if (typeof record.distance === 'number') extractedRecord.distance = record.distance;
                  if (typeof record.altitude === 'number') extractedRecord.altitude = record.altitude;
                  if (typeof record.temperature === 'number') extractedRecord.temperature = record.temperature;
                  if (typeof record.elapsed_time === 'number') extractedRecord.elapsed_time = record.elapsed_time;
                  
                  records.push(extractedRecord);
                }
              });
            }
          }

          // Extract sessions and laps
          let sessions: any[] = [];
          let laps: any[] = [];
          
          if (data.sessions && Array.isArray(data.sessions)) {
            sessions = data.sessions;
          }
          if (data.laps && Array.isArray(data.laps)) {
            laps = data.laps;
          }

          // Calculate duration
          let duration = 0;
          if (records.length > 0) {
            const timestamps = records.filter(r => r.timestamp).map(r => r.timestamp!);
            if (timestamps.length > 1) {
              duration = (Math.max(...timestamps) - Math.min(...timestamps)) / 1000;
            }
          }

          // Try to get duration from sessions if not calculated
          if (duration === 0 && sessions.length > 0) {
            const session = sessions[0];
            if (session.total_elapsed_time) {
              duration = session.total_elapsed_time;
            }
          }

          console.log(`=== FINAL EXTRACTION RESULTS ===`);
          console.log(`Extracted ${records.length} total records`);
          console.log(`Records with power: ${records.filter(r => r.power !== undefined).length}`);
          console.log(`Records with cadence: ${records.filter(r => r.cadence !== undefined).length}`);
          console.log(`Records with heart_rate: ${records.filter(r => r.heart_rate !== undefined).length}`);
          console.log(`Records with timestamp: ${records.filter(r => r.timestamp !== undefined).length}`);
          console.log(`Sessions: ${sessions.length}`);
          console.log(`Laps: ${laps.length}`);
          console.log(`Duration: ${duration} seconds`);
          
          // Log sample of actual extracted data
          const sampleRecords = records.slice(0, 3);
          console.log('Sample extracted records:', sampleRecords);

          resolve({
            records,
            sessions,
            laps,
            duration,
            device_info: data.device_info,
            file_info: data.file_info,
            rawDataStructure: data
          });
        });

      } catch (error) {
        console.error('Error processing FIT file:', error);
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
};
