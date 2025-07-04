
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
          console.log('Full parsed data keys:', Object.keys(data));
          console.log('Data.activity type:', typeof data.activity);
          console.log('Data.activity is array:', Array.isArray(data.activity));
          
          if (data.activity) {
            console.log('Activity keys:', Object.keys(data.activity));
            console.log('Activity content sample:', data.activity);
          }
          
          const records: FitRecord[] = [];

          // Handle different data structures
          if (data.activity) {
            if (Array.isArray(data.activity)) {
              // If activity is an array, process each record
              console.log(`Processing ${data.activity.length} activity records as array`);
              data.activity.forEach((record: any, index: number) => {
                if (record && typeof record === 'object') {
                  const extractedRecord = extractRecord(record, index);
                  if (extractedRecord) records.push(extractedRecord);
                }
              });
            } else if (typeof data.activity === 'object') {
              // If activity is an object, look for nested arrays
              console.log('Activity is object, looking for nested data...');
              
              // Check for records property
              if (data.activity.records && Array.isArray(data.activity.records)) {
                console.log(`Found activity.records with ${data.activity.records.length} items`);
                data.activity.records.forEach((record: any, index: number) => {
                  const extractedRecord = extractRecord(record, index);
                  if (extractedRecord) records.push(extractedRecord);
                });
              }
              
              // Check for other possible array properties
              Object.keys(data.activity).forEach(key => {
                if (Array.isArray(data.activity[key])) {
                  console.log(`Found activity.${key} array with ${data.activity[key].length} items`);
                  data.activity[key].forEach((record: any, index: number) => {
                    const extractedRecord = extractRecord(record, index);
                    if (extractedRecord) records.push(extractedRecord);
                  });
                }
              });
            }
          }
          
          // Fallback: Try other locations if no records found
          if (records.length === 0) {
            console.log('No records found in activity, trying other locations...');
            
            // Try direct records array
            if (data.records && Array.isArray(data.records)) {
              console.log(`Found data.records with ${data.records.length} items`);
              data.records.forEach((record: any, index: number) => {
                const extractedRecord = extractRecord(record, index);
                if (extractedRecord) records.push(extractedRecord);
              });
            }
            
            // Try sessions
            if (data.sessions && Array.isArray(data.sessions)) {
              console.log(`Checking ${data.sessions.length} sessions for records`);
              data.sessions.forEach((session: any) => {
                if (session.records && Array.isArray(session.records)) {
                  session.records.forEach((record: any, index: number) => {
                    const extractedRecord = extractRecord(record, index);
                    if (extractedRecord) records.push(extractedRecord);
                  });
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
          console.log(`Records with power: ${records.filter(r => r.power !== undefined && r.power !== null).length}`);
          console.log(`Records with cadence: ${records.filter(r => r.cadence !== undefined && r.cadence !== null).length}`);
          console.log(`Records with heart_rate: ${records.filter(r => r.heart_rate !== undefined && r.heart_rate !== null).length}`);
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

// Helper function to extract and convert record data
function extractRecord(record: any, index: number): FitRecord | null {
  if (!record || typeof record !== 'object') return null;
  
  // Handle timestamp conversion properly
  let timestamp: number | undefined;
  if (record.timestamp) {
    if (typeof record.timestamp === 'string') {
      // Handle ISO date strings properly
      const date = new Date(record.timestamp);
      timestamp = date.getTime(); // Already in milliseconds
      
      // Debug timestamp conversion for first few records
      if (index < 3) {
        console.log(`Record ${index} timestamp conversion:`, {
          original: record.timestamp,
          converted: timestamp,
          humanReadable: new Date(timestamp).toISOString()
        });
      }
    } else if (typeof record.timestamp === 'number') {
      timestamp = record.timestamp;
    } else if (record.timestamp instanceof Date) {
      timestamp = record.timestamp.getTime();
    }
  }
  
  // Extract all available data without filtering
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
  
  // Log first few records for debugging
  if (index < 5) {
    console.log(`Record ${index}:`, {
      timestamp: extractedRecord.timestamp,
      power: extractedRecord.power,
      cadence: extractedRecord.cadence,
      heart_rate: extractedRecord.heart_rate,
      originalRecord: record
    });
  }
  
  return extractedRecord;
}

