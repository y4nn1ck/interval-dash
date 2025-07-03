
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
          console.log('Full parsed data:', data);
          
          const records: FitRecord[] = [];

          // NEW LOGIC: Based on user description - activity contains multiple arrays, one per second
          if (data.activity) {
            console.log('Found activity data:', data.activity);
            
            // Check if activity is an object containing arrays or if it's directly an array
            let activityRecords: any[] = [];
            
            if (Array.isArray(data.activity)) {
              activityRecords = data.activity;
            } else if (typeof data.activity === 'object') {
              // If activity is an object, look for arrays within it
              Object.keys(data.activity).forEach(key => {
                const value = data.activity[key];
                if (Array.isArray(value)) {
                  activityRecords = activityRecords.concat(value);
                } else if (value && typeof value === 'object') {
                  // Check if this object has the expected structure (timestamp, power, etc.)
                  if (value.timestamp !== undefined || value.power !== undefined) {
                    activityRecords.push(value);
                  }
                }
              });
            }
            
            console.log(`Processing ${activityRecords.length} activity records`);
            
            activityRecords.forEach((record: any, index: number) => {
              if (record && typeof record === 'object') {
                // Handle timestamp conversion
                let timestamp: number | undefined;
                if (record.timestamp) {
                  if (typeof record.timestamp === 'string') {
                    timestamp = new Date(record.timestamp).getTime();
                  } else if (typeof record.timestamp === 'number') {
                    timestamp = record.timestamp;
                  } else if (record.timestamp instanceof Date) {
                    timestamp = record.timestamp.getTime();
                  }
                }
                
                const extractedRecord: FitRecord = {
                  timestamp,
                  power: record.power,
                  cadence: record.cadence,
                  heart_rate: record.heart_rate,
                  speed: record.speed,
                  distance: record.distance,
                  altitude: record.altitude,
                  temperature: record.temperature,
                };
                
                records.push(extractedRecord);
                
                // Log first few records for debugging
                if (index < 5) {
                  console.log(`Activity Record ${index}:`, extractedRecord);
                }
              }
            });
          }
          
          // FALLBACK: Try to extract from other possible locations
          if (records.length === 0) {
            console.log('No records found in activity, trying other locations...');
            
            // Try sessions
            if (data.sessions && Array.isArray(data.sessions)) {
              data.sessions.forEach((session: any) => {
                if (session.records && Array.isArray(session.records)) {
                  session.records.forEach((record: any) => {
                    if (record.power !== undefined) {
                      records.push({
                        timestamp: record.timestamp,
                        power: record.power,
                        cadence: record.cadence,
                        heart_rate: record.heart_rate,
                        speed: record.speed,
                        distance: record.distance,
                        altitude: record.altitude,
                        temperature: record.temperature,
                      });
                    }
                  });
                }
              });
            }
            
            // Try records directly
            if (data.records && Array.isArray(data.records)) {
              data.records.forEach((record: any) => {
                if (record.power !== undefined) {
                  records.push({
                    timestamp: record.timestamp,
                    power: record.power,
                    cadence: record.cadence,
                    heart_rate: record.heart_rate,
                    speed: record.speed,
                    distance: record.distance,
                    altitude: record.altitude,
                    temperature: record.temperature,
                  });
                }
              });
            }
            
            // Try any top-level arrays
            Object.keys(data).forEach(key => {
              if (Array.isArray(data[key]) && key !== 'sessions' && key !== 'laps') {
                data[key].forEach((item: any) => {
                  if (item && typeof item === 'object' && item.power !== undefined) {
                    records.push({
                      timestamp: item.timestamp,
                      power: item.power,
                      cadence: item.cadence,
                      heart_rate: item.heart_rate,
                      speed: item.speed,
                      distance: item.distance,
                      altitude: item.altitude,
                      temperature: item.temperature,
                    });
                  }
                });
              }
            });
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
          console.log(`Records with power: ${records.filter(r => r.power && r.power > 0).length}`);
          console.log(`Records with cadence: ${records.filter(r => r.cadence && r.cadence > 0).length}`);
          console.log(`Records with heart_rate: ${records.filter(r => r.heart_rate && r.heart_rate > 0).length}`);
          console.log(`Sessions: ${sessions.length}`);
          console.log(`Laps: ${laps.length}`);
          console.log(`Duration: ${duration} seconds`);

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
