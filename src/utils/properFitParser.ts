
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

          console.log('Raw FIT data structure:', data);
          console.log('Available data keys:', Object.keys(data));

          // Extract records more broadly - check all possible record types
          const records: FitRecord[] = [];
          
          // Try different ways to access records
          let recordsSource = data.records || data.activity?.records || [];
          
          console.log('Records source found:', recordsSource ? recordsSource.length : 0);
          console.log('Sample record structure:', recordsSource[0]);

          if (recordsSource && Array.isArray(recordsSource)) {
            recordsSource.forEach((record: any, index: number) => {
              // Log first few records to understand structure
              if (index < 3) {
                console.log(`Record ${index}:`, record);
              }
              
              // Accept records with any useful data, not just power
              if (record && (
                record.power !== undefined || 
                record.cadence !== undefined || 
                record.heart_rate !== undefined ||
                record.speed !== undefined ||
                record.distance !== undefined
              )) {
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

          // If no records found, try alternative data structures
          if (records.length === 0) {
            console.log('No records found in standard location, checking alternative structures...');
            
            // Check if data is nested differently
            if (data.activity) {
              console.log('Activity data:', data.activity);
            }
            
            // Try to find any array that might contain records
            Object.keys(data).forEach(key => {
              if (Array.isArray(data[key]) && data[key].length > 0) {
                console.log(`Found array '${key}' with ${data[key].length} items:`, data[key][0]);
              }
            });
          }

          // Calculate duration
          let duration = 0;
          if (records.length > 0 && records[0].timestamp && records[records.length - 1].timestamp) {
            const firstTime = new Date(records[0].timestamp).getTime();
            const lastTime = new Date(records[records.length - 1].timestamp).getTime();
            duration = (lastTime - firstTime) / 1000; // Convert to seconds
          }

          console.log(`Properly parsed ${records.length} records from FIT file`);
          console.log('Sample records:', records.slice(0, 3));
          console.log('Sessions:', data.sessions);
          console.log('Laps:', data.laps);

          resolve({
            records,
            sessions: data.sessions || [],
            laps: data.laps || [],
            duration,
            device_info: data.device_info,
            file_info: data.file_info
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
