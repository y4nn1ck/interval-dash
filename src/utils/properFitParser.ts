
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
          let recordsSource: any[] = [];

          // NEW LOGIC: Direct access to activity records
          if (data.activity) {
            console.log('Found activity data:', typeof data.activity, Array.isArray(data.activity));
            
            // If activity is an array, each element should be a record
            if (Array.isArray(data.activity)) {
              console.log(`Activity is array with ${data.activity.length} elements`);
              recordsSource = data.activity;
            }
            // If activity is an object, it might have nested structure
            else if (typeof data.activity === 'object') {
              console.log('Activity is object, looking for records inside');
              
              // Check if activity has records property
              if (data.activity.records && Array.isArray(data.activity.records)) {
                console.log(`Found ${data.activity.records.length} records in activity.records`);
                recordsSource = data.activity.records;
              }
              // Check if activity has sessions with records
              else if (data.activity.sessions && Array.isArray(data.activity.sessions)) {
                console.log('Looking for records in sessions');
                data.activity.sessions.forEach((session: any, sessionIndex: number) => {
                  if (session.records && Array.isArray(session.records)) {
                    console.log(`Found ${session.records.length} records in session ${sessionIndex}`);
                    recordsSource = recordsSource.concat(session.records);
                  }
                });
              }
              // Check if activity has laps with records
              else if (data.activity.laps && Array.isArray(data.activity.laps)) {
                console.log('Looking for records in laps');
                data.activity.laps.forEach((lap: any, lapIndex: number) => {
                  if (lap.records && Array.isArray(lap.records)) {
                    console.log(`Found ${lap.records.length} records in lap ${lapIndex}`);
                    recordsSource = recordsSource.concat(lap.records);
                  }
                });
              }
            }
          }
          
          // Fallback: check for direct records array
          if (recordsSource.length === 0 && data.records && Array.isArray(data.records)) {
            console.log('Using direct records array with length:', data.records.length);
            recordsSource = data.records;
          }

          console.log('=== RECORD EXTRACTION ===');
          console.log('Total raw records found:', recordsSource.length);
          
          if (recordsSource.length > 0) {
            console.log('Sample raw records:', recordsSource.slice(0, 3));
            
            recordsSource.forEach((record: any, index: number) => {
              if (record && typeof record === 'object') {
                // Handle timestamp - look for ISO string format
                let timestamp: number | undefined;
                if (record.timestamp) {
                  if (typeof record.timestamp === 'string') {
                    // Direct ISO string like "2025-07-01T16:03:31.000Z"
                    timestamp = new Date(record.timestamp).getTime();
                  } else if (typeof record.timestamp === 'number') {
                    timestamp = record.timestamp;
                  } else if (record.timestamp && record.timestamp.value) {
                    // Handle nested timestamp objects
                    if (typeof record.timestamp.value === 'string') {
                      timestamp = new Date(record.timestamp.value).getTime();
                    } else if (typeof record.timestamp.value === 'number') {
                      timestamp = record.timestamp.value;
                    }
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
                if (index < 10) {
                  console.log(`Record ${index}:`, extractedRecord);
                }
              }
            });
          }

          // Extract sessions and laps
          let sessions: any[] = [];
          let laps: any[] = [];
          
          if (data.activity) {
            if (data.activity.sessions && Array.isArray(data.activity.sessions)) {
              sessions = data.activity.sessions;
            }
            if (data.activity.laps && Array.isArray(data.activity.laps)) {
              laps = data.activity.laps;
            }
          }
          
          // Fallback for sessions and laps
          if (sessions.length === 0 && data.sessions && Array.isArray(data.sessions)) {
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
