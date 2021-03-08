import { Buffer } from "buffer";

interface PrinterType {
  codePage: Record<string, string>;
  config: Record<string, Buffer>;
  beep: () => Buffer;
  append: (appendBuffer: Buffer) => void;
  setTextSize: (height: number, width: number) => Buffer;
  printQR: (data: string, settings: any) => Buffer;
  pdf417: (data: string, settings: any) => Buffer;
  code128: (data: string, settings: any) => Buffer;
  maxiCode: (data: string, settings: any) => Buffer;
  printBarcode: (data: string, type: string, settings: any) => Buffer;
}

export default PrinterType;
