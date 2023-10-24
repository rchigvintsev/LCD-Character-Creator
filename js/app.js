const NUMBER_OF_CHARS = 8;
const NUMBER_OF_ROWS = 8;
const NUMBER_OF_COLS = 5;

function createPlaceholders() {
    let result = "byte customChars[][8] = {\n";
    for (let ch = 0; ch < NUMBER_OF_CHARS; ch++) {
        if (ch > 0) {
            result += ",\n";
        }
        result += "  {";
        for (let row = 0; row < NUMBER_OF_ROWS; row++) {
            if (row > 0) {
                result += ", ";
            }
            result += "{DataChar" + ch + "Row" + row + "}";
        }
        result += "}";
    }
    result += "\n};"
    return result;
}

let ArduinoCommonTemplate = createPlaceholders();
ArduinoCommonTemplate += "\n\n";
ArduinoCommonTemplate += "void setup() {\n";
ArduinoCommonTemplate += "  lcd.begin(16, 2);\n\n";
ArduinoCommonTemplate += "  for (int i = 0; i < NUMBER_OF_CUSTOM_CHARS; i++) {\n";
ArduinoCommonTemplate += "    lcd.createChar(i, customChars[i]);\n";
ArduinoCommonTemplate += "  }\n\n"
ArduinoCommonTemplate += "  // Top row\n"
ArduinoCommonTemplate += "  lcd.setCursor(0, 0);\n";
ArduinoCommonTemplate += "  for (int i = 0; i < NUMBER_OF_CUSTOM_CHARS / 2; i++) {\n";
ArduinoCommonTemplate += "    lcd.write(i);\n";
ArduinoCommonTemplate += "  }\n\n";
ArduinoCommonTemplate += "  // Bottom row\n"
ArduinoCommonTemplate += "  lcd.setCursor(0, 1);\n";
ArduinoCommonTemplate += "  for (int i = NUMBER_OF_CUSTOM_CHARS / 2; i < NUMBER_OF_CUSTOM_CHARS; i++) {\n";
ArduinoCommonTemplate += "    lcd.write(i);\n";
ArduinoCommonTemplate += "  }\n";
ArduinoCommonTemplate += "}\n\n";
ArduinoCommonTemplate += "void loop() {}";

let ArduinoTemplate = "";
ArduinoTemplate += "#include &lt;LiquidCrystal.h&gt;\n\n";
ArduinoTemplate += "#define NUMBER_OF_CUSTOM_CHARS " + NUMBER_OF_CHARS + "\n\n";
ArduinoTemplate += "LiquidCrystal lcd(12, 11, 5, 4, 3, 2); // RS, E, D4, D5, D6, D7\n\n";
ArduinoTemplate += ArduinoCommonTemplate;

let ArduinoI2CTemplate = "";
ArduinoI2CTemplate += "#include &lt;Wire.h&gt;\n";
ArduinoI2CTemplate += "#include &lt;LiquidCrystal_I2C.h&gt;\n\n";
ArduinoI2CTemplate += "#define NUMBER_OF_CUSTOM_CHARS " + NUMBER_OF_CHARS + "\n\n";
ArduinoI2CTemplate += "// Set the LCD address to 0x27 in PCF8574 by NXP and Set to 0x3F in PCF8574A by Ti\n";
ArduinoI2CTemplate += "LiquidCrystal_I2C lcd(0x3F, 16, 2);\n\n";
ArduinoI2CTemplate += ArduinoCommonTemplate;

function binaryToHex(s) {
    let result = '';
    let i, k, accum;
    for (i = s.length - 1; i >= 3; i -= 4) {
        // Extract out in substrings of 4 and convert to hex
        const part = s.substring(i + 1 - 4, 5);
        accum = 0;
        for (k = 0; k < 4; k += 1) {
            if (part[k] !== '0' && part[k] !== '1') {
                // Invalid character
                return null;
            }
            // Compute the length 4 substring
            accum = accum * 2 + parseInt(part[k], 10);
        }
        if (accum >= 10) {
            // 'A' to 'F'
            result = String.fromCharCode(accum - 10 + 'A'.charCodeAt(0)) + result;
        } else {
            // '0' to '9'
            result = String(accum) + result;
        }
    }

    // Remaining characters, i = 0, 1, or 2
    if (i >= 0) {
        accum = 0;
        // Convert from front
        for (k = 0; k <= i; k += 1) {
            if (s[k] !== '0' && s[k] !== '1') {
                return null;
            }
            accum = accum * 2 + parseInt(s[k], 10);
        }
        // 3 bits, value cannot exceed 2^3 - 1 = 7, just convert
        result = String(accum) + result;
    }
    return result;
}

function forAllPixels(callback) {
    for (let ch = 0; ch < NUMBER_OF_CHARS; ch++) {
        const charElement = $(".box-char[data-char='" + ch + "']");
        for (let row = 0; row < NUMBER_OF_ROWS; row++) {
            for (let col = 0; col < NUMBER_OF_COLS; col++) {
                callback(charElement.find(".dot-px[data-row='" + row + "'][data-col='" + col + "']"));
            }
        }
    }
}

function reloadData() {
    const type = $($("[name='datatype']:checked")[0]).val();

    const data = [];
    for (let ch = 0; ch < NUMBER_OF_CHARS; ch++) {
        const charElement = $(".box-char[data-char='" + ch + "']");
        data[ch] = [];
        for (let row = 0; row < NUMBER_OF_ROWS; row++) {
            let binStr = "";
            for (let col = 0; col < NUMBER_OF_COLS; col++) {
                if (charElement.find(".dot-px[data-row='" + row + "'][data-col='" + col + "']")
                    .attr("class")
                    .indexOf("high") >= 0) {
                    binStr += "1";
                } else {
                    binStr += "0";
                }
            }
            data[ch][row] = type === "hex" ? "0x" + binaryToHex(binStr) : "B" + binStr;
        }
    }

    const interfacing = $($("[name='interfacing']:checked")[0]).val();
    let html = interfacing === "parallel" ? ArduinoTemplate : ArduinoI2CTemplate;
    for (let ch = 0; ch < NUMBER_OF_CHARS; ch++) {
        for (let row = 0; row < NUMBER_OF_ROWS; row++) {
            html = html.replace("{DataChar" + ch + "Row" + row + "}", data[ch][row]);
        }
    }
    $("#code-box").html(html);
    Prism.highlightAll();
}

$(document).ready(() => {
    $(".dot-px").click(e => {
        const $target = $(e.target);
        if ($target.attr("class").indexOf("high") >= 0) {
            $target.removeClass("high");
        } else {
            $target.addClass("high");
        }
        reloadData();
    });

    $("[name='color']").change(e => $(".box-char")
        .removeClass("green")
        .removeClass("blue")
        .addClass($(e.target).val()));

    $("[name='datatype'], [name='interfacing']").change(() => reloadData());

    $("#clear").click(() => {
        forAllPixels(pixelElement => pixelElement.removeClass("high"));
        reloadData();
    });

    $("#invert").click(() => {
        forAllPixels(pixelElement => {
            if (pixelElement.attr("class").indexOf("high") >= 0) {
                pixelElement.removeClass("high");
            } else {
                pixelElement.addClass("high");
            }
        });
        reloadData();
    });

    reloadData();
});