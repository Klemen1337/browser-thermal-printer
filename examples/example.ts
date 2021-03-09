import ThermalPrinter, { PrinterTypes, TableAlign } from "../src/core"

async function example () {
  const printer = new ThermalPrinter(PrinterTypes.EPSON);

  printer.alignCenter();
  await printer.printImage('./assets/olaii-logo-black-small.png');

  printer.alignLeft();
  printer.newLine();
  printer.println("Hello World!");
  printer.drawLine();

  printer.upsideDown(true);
  printer.println("Hello World upside down!");
  printer.upsideDown(false);
  printer.drawLine();

  printer.invert(true);
  printer.println("Hello World inverted!");
  printer.invert(false);
  printer.drawLine();

  printer.println("Special characters: ČčŠšŽžĐđĆćßẞöÖÄäüÜé");
  printer.drawLine();

  printer.setTypeFontB();
  printer.println("Type font B");
  printer.setTypeFontA();
  printer.println("Type font A");
  printer.drawLine();

  printer.alignLeft();
  printer.println("This text is on the left");
  printer.alignCenter();
  printer.println("This text is in the middle");
  printer.alignRight();
  printer.println("This text is on the right");
  printer.alignLeft();
  printer.drawLine();

  printer.setTextDoubleHeight();
  printer.println("This is double height");
  printer.setTextDoubleWidth();
  printer.println("This is double width");
  printer.setTextQuadArea();
  printer.println("This is quad");
  printer.setTextSize(7,7);
  printer.println("Wow");
  printer.setTextSize(0,0);
  printer.setTextNormal();
  printer.println("This is normal");
  printer.drawLine();

  try {
    printer.printBarcode("4126570807191");
    printer.code128("4126570807191", {
      height: 50,
      text: 1
    });
    printer.beep();
  } catch (error) {
    console.error(error);
  }

  printer.pdf417("4126565129008670807191");
  printer.printQR("https://olaii.com");

  printer.newLine();

  printer.leftRight("Left", "Right");

  printer.table(["One", "Two", "Three", "Four"]);

  printer.tableCustom([
    { text:"Left", align:TableAlign.LEFT, width:0.5 },
    { text:"Center", align:TableAlign.CENTER, width:0.25, bold:true },
    { text:"Right", align:TableAlign.RIGHT, width:0.25 }
  ]);

  printer.tableCustom([
    { text:"Left", align:TableAlign.LEFT, cols:8 },
    { text:"Center", align:TableAlign.CENTER, cols:10, bold:true },
    { text:"Right", align:TableAlign.RIGHT, cols:10 }
  ]);

  printer.cut();
  printer.openCashDrawer();

  // Print raw
  console.log(printer.getText());
}


example();
