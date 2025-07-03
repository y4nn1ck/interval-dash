
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

          // Look for records in the activity structure
          if (data.activity && Array.isArray(data.activity)) {
            console.log('Found activity array with', data.activity.length, 'items');
            
            data.activity.forEach((activityItem: any, index: number) => {
              console.log(`Activity item ${index}:`, activityItem);
              
              // Check if this activity item has direct record data
              if (Array.isArray(activityItem)) {
                console.log(`Activity item ${index} is an array with ${activityItem.length} records`);
                recordsSource = recordsSource.concat(activityItem);
              }
              // Check if records are nested in a records property
              else if (activityItem.records && Array.isArray(activityItem.records)) {
                console.log(`Found ${activityItem.records.length} records in activity[${index}].records`);
                recordsSource = recordsSource.concat(activityItem.records);
              }
              // Check if the activity item itself contains record-like data
              else if (activityItem.timestamp || activityItem.power || activityItem.cadence) {
                console.log(`Activity item ${index} appears to be a record itself`);
                recordsSource.push(activityItem);
              }
            });
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
                // Handle timestamp - could be ISO string or number
                let timestamp: number | undefined;
                if (record.timestamp) {
                  if (typeof record.timestamp === 'string') {
                    timestamp = new Date(record.timestamp).getTime();
                  } else if (typeof record.timestamp === 'number') {
                    timestamp = record.timestamp;
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
                  console.log(`Record ${index}:`, extractedRecord);
                }
              }
            });
          }

          // Extract sessions and laps with similar logic
          let sessions: any[] = [];
          let laps: any[] = [];
          
          if (data.activity && Array.isArray(data.activity)) {
            data.activity.forEach((activityItem: any) => {
              if (activityItem.sessions && Array.isArray(activityItem.sessions)) {
                sessions = sessions.concat(activityItem.sessions);
              }
              if (activityItem.laps && Array.isArray(activityItem.laps)) {
                laps = laps.concat(activityItem.laps);
              }
            });
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
          console.log(`Extracted ${records.length} records`);
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
