
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
  core_temperature?: number;
  skin_temperature?: number;
  elapsed_time?: number;
  position_lat?: number;
  position_long?: number;
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
                if (typeof record.core_temperature === 'number') extractedRecord.core_temperature = record.core_temperature;
                if (typeof record.skin_temperature === 'number') extractedRecord.skin_temperature = record.skin_temperature;
                if (typeof record.elapsed_time === 'number') extractedRecord.elapsed_time = record.elapsed_time;
                
                // Extract GPS coordinates (may be in semicircles or degrees)
                if (typeof record.position_lat === 'number') {
                  // Convert from semicircles to degrees if needed (semicircles are large numbers)
                  extractedRecord.position_lat = Math.abs(record.position_lat) > 180 
                    ? record.position_lat * (180 / Math.pow(2, 31))
                    : record.position_lat;
                }
                if (typeof record.position_long === 'number') {
                  extractedRecord.position_long = Math.abs(record.position_long) > 180 
                    ? record.position_long * (180 / Math.pow(2, 31))
                    : record.position_long;
                }
                
                records.push(extractedRecord);
                
                // Log first few records for debugging
                if (index < 3) {
                  console.log(`Record ${index}:`, {
                    timestamp: extractedRecord.timestamp,
                    power: extractedRecord.power,
                    cadence: extractedRecord.cadence,
                    heart_rate: extractedRecord.heart_rate,
                    temperature: extractedRecord.temperature,
                    core_temperature: extractedRecord.core_temperature,
                    skin_temperature: extractedRecord.skin_temperature,
                    elapsed_time: extractedRecord.elapsed_time,
                    altitude: extractedRecord.altitude,
                    position_lat: extractedRecord.position_lat,
                    position_long: extractedRecord.position_long,
                    originalRecord: record
                  });
                }
              }
            });
          } else {
            console.log('No activity.records found, trying cascade structure (sessions>laps>records)...');
            
            // Cascade mode: records are nested in activity.sessions[].laps[].records[]
            if (data.activity?.sessions) {
              for (const session of data.activity.sessions) {
                if (session.laps && Array.isArray(session.laps)) {
                  for (const lap of session.laps) {
                    if (lap.records && Array.isArray(lap.records)) {
                      console.log(`Found ${lap.records.length} records in lap`);
                      lap.records.forEach((record: any, index: number) => {
                        if (record && typeof record === 'object') {
                          const extractedRecord: FitRecord = {};
                          
                          const extractedTimestamp = extractTimestamp(record.timestamp);
                          if (extractedTimestamp) extractedRecord.timestamp = extractedTimestamp;
                          
                          if (typeof record.power === 'number') extractedRecord.power = record.power;
                          if (typeof record.cadence === 'number') extractedRecord.cadence = record.cadence;
                          if (typeof record.heart_rate === 'number') extractedRecord.heart_rate = record.heart_rate;
                          if (typeof record.speed === 'number') extractedRecord.speed = record.speed;
                          if (typeof record.distance === 'number') extractedRecord.distance = record.distance;
                          if (typeof record.altitude === 'number') extractedRecord.altitude = record.altitude;
                          if (typeof record.temperature === 'number') extractedRecord.temperature = record.temperature;
                          if (typeof record.core_temperature === 'number') extractedRecord.core_temperature = record.core_temperature;
                          if (typeof record.skin_temperature === 'number') extractedRecord.skin_temperature = record.skin_temperature;
                          if (typeof record.elapsed_time === 'number') extractedRecord.elapsed_time = record.elapsed_time;
                          
                          if (typeof record.position_lat === 'number') {
                            extractedRecord.position_lat = Math.abs(record.position_lat) > 180 
                              ? record.position_lat * (180 / Math.pow(2, 31))
                              : record.position_lat;
                          }
                          if (typeof record.position_long === 'number') {
                            extractedRecord.position_long = Math.abs(record.position_long) > 180 
                              ? record.position_long * (180 / Math.pow(2, 31))
                              : record.position_long;
                          }
                          
                          records.push(extractedRecord);
                          
                          if (records.length <= 3) {
                            console.log(`Record ${records.length - 1}:`, {
                              power: extractedRecord.power,
                              cadence: extractedRecord.cadence,
                              heart_rate: extractedRecord.heart_rate,
                              elapsed_time: extractedRecord.elapsed_time,
                              altitude: extractedRecord.altitude,
                              position_lat: extractedRecord.position_lat,
                              position_long: extractedRecord.position_long,
                            });
                          }
                        }
                      });
                    }
                  }
                }
              }
              if (records.length > 0) {
                console.log(`Extracted ${records.length} records from cascade structure`);
              }
            }
            
            // Fallback: direct records array
            if (records.length === 0 && data.records && Array.isArray(data.records)) {
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
                  if (typeof record.core_temperature === 'number') extractedRecord.core_temperature = record.core_temperature;
                  if (typeof record.skin_temperature === 'number') extractedRecord.skin_temperature = record.skin_temperature;
                  if (typeof record.elapsed_time === 'number') extractedRecord.elapsed_time = record.elapsed_time;
                  
                  // Extract GPS coordinates for fallback path
                  if (typeof record.position_lat === 'number') {
                    extractedRecord.position_lat = Math.abs(record.position_lat) > 180 
                      ? record.position_lat * (180 / Math.pow(2, 31))
                      : record.position_lat;
                  }
                  if (typeof record.position_long === 'number') {
                    extractedRecord.position_long = Math.abs(record.position_long) > 180 
                      ? record.position_long * (180 / Math.pow(2, 31))
                      : record.position_long;
                  }
                  
                  records.push(extractedRecord);
                }
              });
            }
          }

          // Extract sessions and laps
          let sessions: any[] = [];
          let laps: any[] = [];
          
          if (data.activity?.sessions && Array.isArray(data.activity.sessions)) {
            sessions = data.activity.sessions;
            for (const session of data.activity.sessions) {
              if (session.laps && Array.isArray(session.laps)) {
                laps = laps.concat(session.laps);
              }
            }
          } else if (data.sessions && Array.isArray(data.sessions)) {
            sessions = data.sessions;
          }
          if (laps.length === 0 && data.laps && Array.isArray(data.laps)) {
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
          console.log(`Records with temperature: ${records.filter(r => r.temperature !== undefined).length}`);
          console.log(`Records with core_temperature: ${records.filter(r => r.core_temperature !== undefined).length}`);
          console.log(`Records with skin_temperature: ${records.filter(r => r.skin_temperature !== undefined).length}`);
          console.log(`Records with altitude: ${records.filter(r => r.altitude !== undefined).length}`);
          console.log(`Records with GPS: ${records.filter(r => r.position_lat !== undefined && r.position_long !== undefined).length}`);
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
