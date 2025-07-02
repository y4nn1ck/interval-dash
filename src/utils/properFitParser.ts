
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

          console.log('=== COMPLETE RAW FIT DATA STRUCTURE ===');
          console.log('Full data object:', JSON.stringify(data, null, 2));
          console.log('Available top-level keys:', Object.keys(data));
          
          // Log each top-level property in detail
          Object.keys(data).forEach(key => {
            console.log(`=== ${key.toUpperCase()} SECTION ===`);
            console.log(`Type: ${typeof data[key]}`);
            console.log(`Is Array: ${Array.isArray(data[key])}`);
            
            if (Array.isArray(data[key])) {
              console.log(`Array length: ${data[key].length}`);
              if (data[key].length > 0) {
                console.log(`First item:`, data[key][0]);
                console.log(`First item keys:`, Object.keys(data[key][0] || {}));
              }
            } else if (typeof data[key] === 'object' && data[key] !== null) {
              console.log(`Object keys:`, Object.keys(data[key]));
              console.log(`Object content:`, data[key]);
            } else {
              console.log(`Value:`, data[key]);
            }
          });

          // Extract records with extensive debugging
          const records: FitRecord[] = [];
          
          // Check ALL possible locations for records
          const possibleRecordSources = [
            data.records,
            data.activity?.records,
            data.sessions,
            data.laps,
            data.events,
            data.device_info,
            data.file_info,
            data.sport,
            data.workout,
            data.workout_step,
            data.schedule,
            data.totals,
            data.goals,
            data.activity_summary,
            data.monitoring,
            data.monitoring_info
          ];

          console.log('=== SEARCHING FOR RECORDS IN ALL POSSIBLE LOCATIONS ===');
          possibleRecordSources.forEach((source, index) => {
            const sourceNames = ['records', 'activity.records', 'sessions', 'laps', 'events', 'device_info', 'file_info', 'sport', 'workout', 'workout_step', 'schedule', 'totals', 'goals', 'activity_summary', 'monitoring', 'monitoring_info'];
            console.log(`Checking ${sourceNames[index]}:`, source);
            
            if (Array.isArray(source) && source.length > 0) {
              console.log(`Found array with ${source.length} items in ${sourceNames[index]}`);
              console.log(`Sample items:`, source.slice(0, 3));
              
              // Check if any items have power data
              const withPower = source.filter(item => item && (item.power !== undefined || item.watts !== undefined));
              console.log(`Items with power data in ${sourceNames[index]}:`, withPower.length);
              if (withPower.length > 0) {
                console.log(`Power data samples:`, withPower.slice(0, 3));
              }
            }
          });

          // Try to extract ANY data that might contain useful information
          const allArrays = [];
          
          function findAllArrays(obj: any, path = '') {
            if (Array.isArray(obj)) {
              allArrays.push({ path, data: obj });
            } else if (typeof obj === 'object' && obj !== null) {
              Object.keys(obj).forEach(key => {
                findAllArrays(obj[key], path ? `${path}.${key}` : key);
              });
            }
          }
          
          findAllArrays(data);
          
          console.log('=== ALL ARRAYS FOUND IN FIT DATA ===');
          allArrays.forEach(arr => {
            console.log(`Path: ${arr.path}, Length: ${arr.data.length}`);
            if (arr.data.length > 0) {
              console.log(`Sample:`, arr.data[0]);
            }
          });

          // Now try to extract records from the most likely source
          let recordsSource = data.records || [];
          
          // If main records is empty, try alternative sources
          if (!recordsSource || recordsSource.length === 0) {
            console.log('Main records empty, trying alternative sources...');
            
            // Try sessions first (might contain summary data)
            if (data.sessions && Array.isArray(data.sessions) && data.sessions.length > 0) {
              console.log('Using sessions as record source');
              recordsSource = data.sessions;
            }
            // Try laps
            else if (data.laps && Array.isArray(data.laps) && data.laps.length > 0) {
              console.log('Using laps as record source');
              recordsSource = data.laps;
            }
            // Try any other array with data
            else if (allArrays.length > 0) {
              const largestArray = allArrays.reduce((max, current) => 
                current.data.length > max.data.length ? current : max
              );
              console.log(`Using largest array as record source: ${largestArray.path} (${largestArray.data.length} items)`);
              recordsSource = largestArray.data;
            }
          }

          console.log('=== PROCESSING RECORDS ===');
          console.log('Records source length:', recordsSource?.length || 0);
          console.log('Records source sample:', recordsSource?.slice(0, 3));

          if (recordsSource && Array.isArray(recordsSource)) {
            recordsSource.forEach((record: any, index: number) => {
              if (index < 10) {
                console.log(`Record ${index}:`, record);
              }
              
              // Accept ANY record with useful data
              if (record && typeof record === 'object') {
                const extractedRecord: FitRecord = {
                  timestamp: record.timestamp || record.start_time,
                  power: record.power || record.avg_power || record.max_power || record.watts,
                  cadence: record.cadence || record.avg_cadence,
                  heart_rate: record.heart_rate || record.avg_heart_rate,
                  speed: record.speed || record.avg_speed,
                  distance: record.distance || record.total_distance,
                  altitude: record.altitude || record.total_ascent,
                  temperature: record.temperature,
                };
                
                // Add any other numeric fields that might be useful
                Object.keys(record).forEach(key => {
                  if (typeof record[key] === 'number' && !extractedRecord[key]) {
                    extractedRecord[key] = record[key];
                  }
                });
                
                records.push(extractedRecord);
              }
            });
          }

          // Calculate duration
          let duration = 0;
          if (records.length > 0) {
            const timestamps = records.filter(r => r.timestamp).map(r => new Date(r.timestamp!).getTime());
            if (timestamps.length > 1) {
              duration = (Math.max(...timestamps) - Math.min(...timestamps)) / 1000;
            }
          }

          // Try to get duration from other sources if records don't have it
          if (duration === 0) {
            if (data.sessions && data.sessions[0] && data.sessions[0].total_elapsed_time) {
              duration = data.sessions[0].total_elapsed_time;
            } else if (data.laps && data.laps[0] && data.laps[0].total_elapsed_time) {
              duration = data.laps[0].total_elapsed_time;
            }
          }

          console.log(`=== FINAL RESULTS ===`);
          console.log(`Extracted ${records.length} records`);
          console.log(`Records with power: ${records.filter(r => r.power && r.power > 0).length}`);
          console.log(`Sample extracted records:`, records.slice(0, 5));
          console.log(`Duration: ${duration} seconds`);

          resolve({
            records,
            sessions: data.sessions || [],
            laps: data.laps || [],
            duration,
            device_info: data.device_info,
            file_info: data.file_info,
            rawDataStructure: data // Include complete raw data for debugging
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
