import { Buffer } from "buffer";
import PrinterInterface from "./interfaces/printer-interface";
import Star from "./interfaces/star/star";
import Epson from "./interfaces/epson/epson";
import PNGReader from "png.js";
// import unorm from "unorm";

export enum PrinterTypes {
  "EPSON" = "epson",
  "STAR" = "star"
}

export enum TableAlign {
  "LEFT" = "LEFT",
  "RIGHT" = "RIGHT",
  "CENTER" = "CENTER"
}

export interface TableCustom {
  text: string;
  originalText?: string;
  align: TableAlign;
  width?: number;
  bold?: boolean;
  cols?: number;
}

export default class ThermalPrinter {
  printer: PrinterInterface = new Star();
  buffer: Buffer = new Buffer("");
  config: {
    type: string;
    width: number;
    characterSet: string;
    codePage?: string;
    removeSpecialCharacters: boolean;
    lineCharacter: string;
  };

  constructor(type: PrinterTypes, width?: number, characterSet?: string, removeSpecialCharacters?: boolean, lineCharacter?: string) {
    if (type === PrinterTypes.STAR) {
      this.printer = new Star();
    } else {
      this.printer = new Epson();
    }

    this.config = {
      type: type,
      width: width || 48,
      characterSet: characterSet || "SLOVENIA",
      removeSpecialCharacters: removeSpecialCharacters || false,
      lineCharacter: lineCharacter || "-"
    };

    // Set initial code page.
    this.setCharacterSet(this.config.characterSet);
  }

  cut() {
    this.append(this.printer.config.CTL_VT);
    this.append(this.printer.config.CTL_VT);
    this.append(this.printer.config.PAPER_FULL_CUT);
    this.append(this.printer.config.HW_INIT);
  }

  partialCut() {
    this.append(this.printer.config.CTL_VT);
    this.append(this.printer.config.CTL_VT);
    this.append(this.printer.config.PAPER_PART_CUT);
    this.append(this.printer.config.HW_INIT);
  }

  getWidth() {
    return this.config.width;
  }

  getText() {
    return this.buffer.toString();
  }

  getBuffer() {
    return this.buffer;
  }

  setBuffer(newBuffer: Buffer) {
    this.buffer = Buffer.from(newBuffer);
  }

  clear() {
    this.buffer = new Buffer("");
  }

  add(buffer: Buffer) {
    this.append(buffer);
  }

  print(text: string) {
    text = text || "";
    this.append(text.toString());
  }

  println(text: string) {
    this.print(text);
    this.append("\n");
  }

  printVerticalTab() {
    this.append(this.printer.config.CTL_VT);
  }

  bold(enabled: boolean) {
    if (enabled) this.append(this.printer.config.TXT_BOLD_ON);
    else this.append(this.printer.config.TXT_BOLD_OFF);
  }

  underline(enabled: boolean) {
    if (enabled) this.append(this.printer.config.TXT_UNDERL_ON);
    else this.append(this.printer.config.TXT_UNDERL_OFF);
  }

  underlineThick(enabled: boolean) {
    if (enabled) this.append(this.printer.config.TXT_UNDERL2_ON);
    else this.append(this.printer.config.TXT_UNDERL_OFF);
  }

  upsideDown(enabled: boolean) {
    if (enabled) this.append(this.printer.config.UPSIDE_DOWN_ON);
    else this.append(this.printer.config.UPSIDE_DOWN_OFF);
  }

  invert(enabled: boolean) {
    if (enabled) this.append(this.printer.config.TXT_INVERT_ON);
    else this.append(this.printer.config.TXT_INVERT_OFF);
  }

  openCashDrawer() {
    if (this.config.type === PrinterTypes.STAR) {
      this.append(this.printer.config.CD_KICK);
    } else {
      this.append(this.printer.config.CD_KICK_2);
      this.append(this.printer.config.CD_KICK_5);
    }
  }

  alignCenter() {
    this.append(this.printer.config.TXT_ALIGN_CT);
  }

  alignLeft() {
    this.append(this.printer.config.TXT_ALIGN_LT);
  }

  alignRight() {
    this.append(this.printer.config.TXT_ALIGN_RT);
  }

  setTypeFontA() {
    this.append(this.printer.config.TXT_FONT_A);
  }

  setTypeFontB() {
    this.append(this.printer.config.TXT_FONT_B);
  }

  setTextNormal() {
    this.append(this.printer.config.TXT_NORMAL);
  }

  setTextDoubleHeight() {
    this.append(this.printer.config.TXT_2HEIGHT);
  }

  setTextDoubleWidth() {
    this.append(this.printer.config.TXT_2WIDTH);
  }

  setTextQuadArea() {
    this.append(this.printer.config.TXT_4SQUARE);
  }

  setTextSize(height: number, width: number) {
    this.append(this.printer.setTextSize(height, width));
  }

  // ----------------------------------------------------- NEW LINE -----------------------------------------------------
  newLine() {
    this.append(this.printer.config.CTL_LF);
  }

  // ----------------------------------------------------- DRAW LINE -----------------------------------------------------
  drawLine() {
    // this.newLine();
    for (let i = 0; i < this.config.width; i++) {
      this.append(Buffer.from(this.config.lineCharacter));
    }
    this.newLine();
  }

  // ----------------------------------------------------- LEFT RIGHT -----------------------------------------------------
  leftRight(left: string, right: string) {
    this.append(left.toString());
    const width = this.config.width - left.toString().length - right.toString().length;
    for (let i = 0; i < width; i++) {
      this.append(Buffer.from(" "));
    }
    this.append(right.toString());
    this.newLine();
  }

  // ----------------------------------------------------- TABLE -----------------------------------------------------
  table(data: string[]) {
    const cellWidth = this.config.width / data.length;
    for (let i = 0; i < data.length; i++) {
      this.append(data[i].toString());
      const spaces = cellWidth - data[i].toString().length;
      for (let j = 0; j < spaces; j++) {
        this.append(Buffer.from(" "));
      }
    }
    this.newLine();
  }

  // ----------------------------------------------------- TABLE CUSTOM -----------------------------------------------------
  // Options: text, align, width, bold
  tableCustom(data: TableCustom[]) {
    let cellWidth = this.config.width / data.length;
    const secondLine = [];
    let secondLineEnabled = false;

    for (let i = 0; i < data.length; i++) {
      let tooLong = false;
      const obj = data[i];
      obj.text = obj.text.toString();

      if (obj.width) {
        cellWidth = this.config.width * obj.width;
      } else if (obj.cols) {
        cellWidth = obj.cols;
      }

      if (obj.bold) {
        this.bold(true);
      }

      // If text is too wide go to next line
      if (cellWidth < obj.text.length) {
        tooLong = true;
        obj.originalText = obj.text;
        obj.text = obj.text.substring(0, cellWidth - 1);
      }

      if (obj.align == "CENTER") {
        const spaces = (cellWidth - obj.text.toString().length) / 2;
        for (let j = 0; j < spaces; j++) {
          this.append(Buffer.from(" "));
        }
        if (obj.text != "") this.append(obj.text);
        for (let j = 0; j < spaces - 1; j++) {
          this.append(Buffer.from(" "));
        }
      } else if (obj.align == "RIGHT") {
        const spaces = cellWidth - obj.text.toString().length;
        for (let j = 0; j < spaces; j++) {
          this.append(Buffer.from(" "));
        }
        if (obj.text != "") this.append(obj.text);
      } else {
        if (obj.text != "") this.append(obj.text);
        const spaces = cellWidth - obj.text.toString().length;
        for (let j = 0; j < spaces; j++) {
          this.append(Buffer.from(" "));
        }
      }

      if (obj.bold) {
        this.bold(false);
      }

      if (tooLong) {
        secondLineEnabled = true;
        obj.text = (obj.originalText || "").substring(cellWidth - 1);
        secondLine.push(obj);
      } else {
        obj.text = "";
        secondLine.push(obj);
      }
    }

    this.newLine();

    // Print the second line
    if (secondLineEnabled) {
      this.tableCustom(secondLine);
    }
  }

  // ----------------------------------------------------- BEEP -----------------------------------------------------
  beep() {
    this.append(this.printer.beep());
  }

  // ----------------------------------------------------- PRINT QR -----------------------------------------------------
  printQR(data: string, settings: any) {
    this.append(this.printer.printQR(data, settings));
  }

  // ----------------------------------------------------- PRINT BARCODE -----------------------------------------------------
  printBarcode(data: string, type: string, settings: any) {
    this.append(this.printer.printBarcode(data, type, settings));
  }

  // ----------------------------------------------------- PRINT MAXICODE -----------------------------------------------------
  maxiCode(data: string, settings: any) {
    this.append(this.printer.maxiCode(data, settings));
  }

  // ----------------------------------------------------- PRINT CODE128 -----------------------------------------------------
  code128(data: string, settings: any) {
    this.append(this.printer.code128(data, settings));
  }

  // ----------------------------------------------------- PRINT PDF417 -----------------------------------------------------
  pdf417(data: string, settings: any) {
    this.append(this.printer.pdf417(data, settings));
  }

  // ----------------------------------------------------- PRINT IMAGE -----------------------------------------------------
  async printImage(image: string) {
    // Check for file type
    if (image.slice(-4) === ".png") {
      const response = await this.printer.printImage(image);
      this.append(response);
      return response;
    } else {
      throw new Error("Image printing supports only PNG files.");
    }
  }

  // ----------------------------------------------------- PRINT IMAGE BUFFER -----------------------------------------------------
  async printImageBuffer(buffer: ArrayBuffer): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const reader = new PNGReader(buffer);
      reader.parse((err: any, png: any) => {
        if (err) {
          reject(err);
        } else {
          const buff = this.printer.printImageBuffer(png.width, png.height, png.data);
          this.append(buff);
          resolve(buff);
        }
      });
    });
  }

  // ------------------------------ Set character set ------------------------------
  setCharacterSet(characterSet: string) {
    const buffer = this.printer.config[`CODE_PAGE_${characterSet}`];
    if (buffer) {
      this.append(buffer);
      this.config.codePage = characterSet;
    } else {
      throw new Error(`Code page not recognized: '${characterSet}'`);
    }
  }

  // ------------------------------ Append ------------------------------
  append(text: string | Buffer) {
    // if (typeof text === "string") {
    //   // Remove special characters.
    //   if (this.config.removeSpecialCharacters) {
    //     const combining = /[\u0300-\u036F]/g;
    //     text = unorm.nfkd(text).replace(combining, "");
    //   }

    //   let endBuff = null;
    //   for (const char of text) {
    //     let code = char;
    //     if (!/^[\x00-\x7F]$/.test(char)) {
    //       if (code.toString() === "?") {
    //         // Character not available in active code page, now try all other code pages.
    //         for (const tmpCodePageKey of Object.keys(this.printer.config.CODE_PAGES)) {
    //           if (code.toString() !== "?") {
    //             // We found a match, change active code page.
    //             this.config.codePage = tmpCodePageKey;
    //             code = Buffer.concat([this.printer.codePage[tmpCodePageKey], code]);
    //             break;
    //           }
    //         }
    //       }
    //     }

    //     endBuff = endBuff ? Buffer.concat([endBuff, Buffer.from(code)]) : Buffer.from(code);
    //   }
    //   text = endBuff;
    // }

    if (text) {
      let newBuffer = new Buffer("");
      if (typeof text === "string") {
        newBuffer = Buffer.from(text, "utf-8");
      } else {
        newBuffer = text;
      }

      // Append buffer
      this.buffer = Buffer.concat([this.buffer, newBuffer]);
    }
  }
}
