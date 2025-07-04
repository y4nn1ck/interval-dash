import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Upload, Search } from 'lucide-react';
import { parseProperFitFile } from '@/utils/properFitParser';

interface FitHeader {
  headerSize: number;
  protocolVersion: number;
  profileVersion: number;
  dataSize: number;
  signature: string;
  crc?: number;
}

interface MessageInfo {
  offset: number;
  type: string;
  size: number;
  data: string;
}

interface ParsedFitData {
  records: any[];
  sessions: any[];
  laps: any[];
  duration: number;
  device_info?: any;
  file_info?: any;
  rawDataStructure?: any;
}

const FitRawReader = () => {
  const [fileData, setFileData] = useState<ArrayBuffer | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [header, setHeader] = useState<FitHeader | null>(null);
  const [messages, setMessages] = useState<MessageInfo[]>([]);
  const [hexData, setHexData] = useState<string>('');
  const [parsedFitData, setParsedFitData] = useState<ParsedFitData | null>(null);
  const [searchPattern, setSearchPattern] = useState<string>('');
  const [searchResults, setSearchResults] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setFileName(file.name);
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      setFileData(arrayBuffer);
      
      // Parse header
      const dataView = new DataView(arrayBuffer);
      const parsedHeader = parseHeader(dataView);
      setHeader(parsedHeader);
      
      // Generate hex dump
      const hex = generateHexDump(arrayBuffer);
      setHexData(hex);
      
      // Find messages
      const foundMessages = findMessages(dataView, parsedHeader);
      setMessages(foundMessages);
      
      // Parse with proper FIT parser
      try {
        const fitData = await parseProperFitFile(file);
        setParsedFitData(fitData);
        console.log('FIT data parsed successfully:', fitData);
      } catch (fitError) {
        console.error('FIT parsing error:', fitError);
        toast({
          title: "Erreur du parser FIT",
          description: `${fitError}`,
          variant: "destructive",
        });
      }
      
      toast({
        title: "Fichier chargé avec succès",
        description: `${file.name} analysé (${arrayBuffer.byteLength} bytes)`,
      });
      
    } catch (error) {
      console.error('Error reading FIT file:', error);
      toast({
        title: "Erreur lors du chargement",
        description: `Impossible de lire le fichier ${file.name}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const parseHeader = (dataView: DataView): FitHeader => {
    const headerSize = dataView.getUint8(0);
    const protocolVersion = dataView.getUint8(1);
    const profileVersion = dataView.getUint16(2, true);
    const dataSize = dataView.getUint32(4, true);
    
    // Read signature
    const signature = new TextDecoder().decode(dataView.buffer.slice(8, 12));
    
    let crc: number | undefined;
    if (headerSize >= 14) {
      crc = dataView.getUint16(12, true);
    }
    
    return {
      headerSize,
      protocolVersion,
      profileVersion,
      dataSize,
      signature,
      crc
    };
  };

  const generateHexDump = (buffer: ArrayBuffer): string => {
    const uint8Array = new Uint8Array(buffer);
    let hex = '';
    
    for (let i = 0; i < Math.min(uint8Array.length, 2048); i += 16) {
      // Offset
      const offset = i.toString(16).padStart(8, '0').toUpperCase();
      
      // Hex bytes
      let hexBytes = '';
      let asciiBytes = '';
      
      for (let j = 0; j < 16; j++) {
        if (i + j < uint8Array.length) {
          const byte = uint8Array[i + j];
          hexBytes += byte.toString(16).padStart(2, '0').toUpperCase() + ' ';
          asciiBytes += (byte >= 32 && byte <= 126) ? String.fromCharCode(byte) : '.';
        } else {
          hexBytes += '   ';
          asciiBytes += ' ';
        }
      }
      
      hex += `${offset}: ${hexBytes} |${asciiBytes}|\n`;
    }
    
    if (uint8Array.length > 2048) {
      hex += `\n... (showing first 2048 bytes of ${uint8Array.length} total bytes)`;
    }
    
    return hex;
  };

  const findMessages = (dataView: DataView, header: FitHeader): MessageInfo[] => {
    const messages: MessageInfo[] = [];
    let offset = header.headerSize;
    const endOffset = Math.min(header.headerSize + header.dataSize, dataView.byteLength - 2);
    
    while (offset < endOffset && messages.length < 100) {
      try {
        const recordHeader = dataView.getUint8(offset);
        
        let messageType = 'Unknown';
        let messageSize = 1;
        
        if ((recordHeader & 0x80) === 0) {
          // Normal record
          messageType = 'Normal Record';
          const messageType_field = (recordHeader & 0x0F);
          messageSize = Math.min(20, endOffset - offset);
        } else if ((recordHeader & 0x40) === 0) {
          // Compressed timestamp
          messageType = 'Compressed Timestamp';
          messageSize = Math.min(10, endOffset - offset);
        } else {
          // Definition message
          messageType = 'Definition Message';
          messageSize = Math.min(15, endOffset - offset);
        }
        
        // Get hex data for this message
        const messageData = new Uint8Array(dataView.buffer, offset, messageSize);
        const hexData = Array.from(messageData)
          .map(b => b.toString(16).padStart(2, '0').toUpperCase())
          .join(' ');
        
        messages.push({
          offset,
          type: messageType,
          size: messageSize,
          data: hexData
        });
        
        offset += messageSize;
      } catch (e) {
        offset += 1;
      }
    }
    
    return messages;
  };

  const searchInFile = () => {
    if (!fileData || !searchPattern) return;
    
    const uint8Array = new Uint8Array(fileData);
    const results: number[] = [];
    
    // Search for hex pattern
    if (searchPattern.match(/^[0-9a-fA-F\s]+$/)) {
      const hexBytes = searchPattern.replace(/\s/g, '').match(/.{2}/g);
      if (hexBytes) {
        const searchBytes = hexBytes.map(hex => parseInt(hex, 16));
        
        for (let i = 0; i <= uint8Array.length - searchBytes.length; i++) {
          let match = true;
          for (let j = 0; j < searchBytes.length; j++) {
            if (uint8Array[i + j] !== searchBytes[j]) {
              match = false;
              break;
            }
          }
          if (match) {
            results.push(i);
          }
        }
      }
    }
    
    setSearchResults(results);
  };

  const formatTimestamp = (timestamp: number) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toISOString().replace('T', ' ').substring(0, 19);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">FIT Raw Reader</h1>
        <p className="text-muted-foreground">Analysez la structure binaire brute des fichiers FIT</p>
      </div>

      {/* File Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Télécharger un fichier FIT</CardTitle>
          <CardDescription>Sélectionnez un fichier FIT pour analyser sa structure binaire</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Input
              type="file"
              accept=".fit"
              onChange={handleFileUpload}
              className="flex-1"
              disabled={isLoading}
            />
            <Upload className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>

      {isLoading && (
        <Card>
          <CardContent className="p-6 text-center">
            <p>Analyse du fichier en cours...</p>
          </CardContent>
        </Card>
      )}

      {parsedFitData && parsedFitData.records && parsedFitData.records.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Données FIT extraites - 50 premiers enregistrements</CardTitle>
            <CardDescription>Date/Heure, Puissance et Cadence des premiers enregistrements</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date/Heure</TableHead>
                    <TableHead>Puissance (W)</TableHead>
                    <TableHead>Cadence (RPM)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedFitData.records.slice(0, 50).map((record, index) => (
                    <TableRow key={index}>
                      <TableCell>{formatTimestamp(record.timestamp)}</TableCell>
                      <TableCell>{record.power !== undefined ? record.power : 'N/A'}</TableCell>
                      <TableCell>{record.cadence !== undefined ? record.cadence : 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              Affichage de {Math.min(50, parsedFitData.records.length)} enregistrements sur {parsedFitData.records.length} total
            </div>
          </CardContent>
        </Card>
      )}

      {parsedFitData && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Structure complète des données FIT (Debug)</CardTitle>
              <CardDescription>Toutes les données trouvées par le parser FIT professionnel</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="font-medium">Records</p>
                    <p className="text-muted-foreground">{parsedFitData.records.length}</p>
                  </div>
                  <div>
                    <p className="font-medium">Sessions</p>
                    <p className="text-muted-foreground">{parsedFitData.sessions?.length || 0}</p>
                  </div>
                  <div>
                    <p className="font-medium">Laps</p>
                    <p className="text-muted-foreground">{parsedFitData.laps?.length || 0}</p>
                  </div>
                  <div>
                    <p className="font-medium">Durée</p>
                    <p className="text-muted-foreground">{Math.round(parsedFitData.duration)} sec</p>
                  </div>
                </div>
                
                {parsedFitData.rawDataStructure && (
                  <div>
                    <p className="font-medium mb-2">Structure complète des données (RAW):</p>
                    <pre className="text-xs bg-muted p-4 rounded overflow-x-auto max-h-96">
                      {JSON.stringify(parsedFitData.rawDataStructure, null, 2)}
                    </pre>
                  </div>
                )}
                
                {parsedFitData.records.length > 0 && (
                  <div>
                    <p className="font-medium mb-2">Exemples de records extraits:</p>
                    <pre className="text-xs bg-muted p-4 rounded overflow-x-auto">
                      {JSON.stringify(parsedFitData.records.slice(0, 5), null, 2)}
                    </pre>
                  </div>
                )}
                
                {parsedFitData.sessions && parsedFitData.sessions.length > 0 && (
                  <div>
                    <p className="font-medium mb-2">Sessions:</p>
                    <pre className="text-xs bg-muted p-4 rounded overflow-x-auto">
                      {JSON.stringify(parsedFitData.sessions, null, 2)}
                    </pre>
                  </div>
                )}
                
                {parsedFitData.device_info && (
                  <div>
                    <p className="font-medium mb-2">Info appareil:</p>
                    <pre className="text-xs bg-muted p-4 rounded overflow-x-auto">
                      {JSON.stringify(parsedFitData.device_info, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Données FIT parsées (résumé)</CardTitle>
              <CardDescription>Structure des données extraites par le parser FIT</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="font-medium">Records avec puissance</p>
                    <p className="text-muted-foreground">
                      {parsedFitData.records.filter(r => r.power && r.power > 0).length}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Records avec cadence</p>
                    <p className="text-muted-foreground">
                      {parsedFitData.records.filter(r => r.cadence && r.cadence > 0).length}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Records avec FC</p>
                    <p className="text-muted-foreground">
                      {parsedFitData.records.filter(r => r.heart_rate && r.heart_rate > 0).length}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Records avec vitesse</p>
                    <p className="text-muted-foreground">
                      {parsedFitData.records.filter(r => r.speed && r.speed > 0).length}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {header && (
        <>
          {/* Header Information */}
          <Card>
            <CardHeader>
              <CardTitle>En-tête FIT</CardTitle>
              <CardDescription>Informations de l'en-tête du fichier {fileName}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="font-medium">Taille de l'en-tête</p>
                  <p className="text-muted-foreground">{header.headerSize} bytes</p>
                </div>
                <div>
                  <p className="font-medium">Version protocole</p>
                  <p className="text-muted-foreground">{header.protocolVersion}</p>
                </div>
                <div>
                  <p className="font-medium">Version profil</p>
                  <p className="text-muted-foreground">{header.profileVersion}</p>
                </div>
                <div>
                  <p className="font-medium">Taille des données</p>
                  <p className="text-muted-foreground">{header.dataSize} bytes</p>
                </div>
                <div>
                  <p className="font-medium">Signature</p>
                  <p className="text-muted-foreground">{header.signature}</p>
                </div>
                {header.crc && (
                  <div>
                    <p className="font-medium">CRC</p>
                    <p className="text-muted-foreground">0x{header.crc.toString(16).toUpperCase()}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Search Function */}
          <Card>
            <CardHeader>
              <CardTitle>Recherche de motifs</CardTitle>
              <CardDescription>Recherchez des motifs hexadécimaux dans le fichier</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="Ex: FF FF ou 89 AB CD EF"
                  value={searchPattern}
                  onChange={(e) => setSearchPattern(e.target.value)}
                />
                <Button onClick={searchInFile}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              {searchResults.length > 0 && (
                <div className="mt-4">
                  <p className="font-medium">Résultats trouvés aux offsets:</p>
                  <p className="text-muted-foreground">
                    {searchResults.slice(0, 20).map(offset => `0x${offset.toString(16).toUpperCase()}`).join(', ')}
                    {searchResults.length > 20 && ` ... et ${searchResults.length - 20} autres`}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Messages */}
          <Card>
            <CardHeader>
              <CardTitle>Messages détectés</CardTitle>
              <CardDescription>Premiers messages trouvés dans le fichier</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {messages.map((message, index) => (
                  <div key={index} className="border rounded p-3">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium">{message.type}</span>
                      <span className="text-sm text-muted-foreground">
                        Offset: 0x{message.offset.toString(16).toUpperCase()} ({message.size} bytes)
                      </span>
                    </div>
                    <code className="text-xs bg-muted p-2 rounded block">
                      {message.data}
                    </code>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Hex Dump */}
          <Card>
            <CardHeader>
              <CardTitle>Dump hexadécimal</CardTitle>
              <CardDescription>Affichage hexadécimal des premiers bytes du fichier</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-muted p-4 rounded overflow-x-auto font-mono">
                {hexData}
              </pre>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default FitRawReader;
