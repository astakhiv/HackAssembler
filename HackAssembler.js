const fs = require("node:fs");

const symblolicTable = {
    "R0": "0",
    "R1": "1",
    "R2": "2",
    "R3": "3",
    "R4": "4",
    "R5": "5",
    "R6": "6",
    "R7": "7",
    "R8": "8",
    "R9": "9",
    "R10": "10",
    "R11": "11",
    "R12": "12",
    "R13": "13",
    "R14": "14",
    "R15": "15",
    "SCREEN": "16384",
    "KBD": "24576",
    "SP": "0",
    "LCL": "1",
    "ARG": "2",
    "THIS": "3",
    "THAT": "4",
};

const destToBin = {
    "null": "000",
    "M"   : "001",
    "D"   : "010",
    "MD"  : "011",
    "A"   : "100",
    "AM"  : "101",
    "AD"  : "110",
    "AMD" : "111",
};

const jumpToBin = {
    "null": "000",
    "JGT" : "001",
    "JEQ" : "010",
    "JGE" : "011",
    "JLT" : "100",
    "JNE" : "101",
    "JLE" : "110",
    "JMP" : "111",
};

const compToBin = {
    "0"  : "0101010",
    "1"  : "0111111",
    "-1" : "0111010",
    "D"  : "0001100",
    "A"  : "0110000",
    "!D" : "0001101",
    "!A" : "0110001",
    "-D" : "0001111",
    "-A" : "0110011",
    "D+1": "0011111",
    "A+1": "0110111",
    "D-1": "0001110",
    "A-1": "0110010",
    "D+A": "0000010",
    "D-A": "0010011",
    "A-D": "0000111",
    "D&A": "0000000",
    "D|A": "0010101",
    "M"  : "1110000",
    "!M" : "1110001",
    "-M" : "1110011",
    "M+1": "1110111",
    "M-1": "1110010",
    "D+M": "1000010",
    "D-M": "1010011",
    "M-D": "1000111",
    "D&M": "1000000",
    "D|M": "1010101",
};

function main() {
    console.log("Reading from: " + process.argv[2]);
    const file = fs.readFileSync(process.argv[2], "utf8");

    const path = process.argv[2].split("/");
    const fileName = path[path.length-1].slice(0, -4);
    
    const commands = getCommands(file); 
    replaceSymbols(commands);
    const binCode = parseCommands(commands);

    fs.writeFileSync(fileName + ".hack", binCode);
}

main();

function parseCommands(commands) {
    let output = "";

    for (let i = 0; i < commands.length; i++) {
        const command = commands[i];

        if (command[0] === "@") {
            output += parseA(command) + "\n";
        } else {
            output += parseC(command) + "\n"; 
        }
    }

    return output;
}

function parseA(command) {
   return "0" + toBinary(+(command.slice(1)));
}

function parseC(command) {
    let dest = "null";
    let comp = "";
    let jump = "null";

    let cur = "";
    for (let i = 0; i < command.length; i++) {
        if (command[i] === "=") {
            dest = cur;
            cur = "";
        } else if (command[i] === ";" || (i === command.length-1 && comp == "")) {
            comp = cur + ((i === command.length-1) ? command[i] : "");
            cur = "";
        } else if (comp != "" && i === command.length-1) {
            jump = cur + command[i];
        } else {
            cur += command[i];
        }
    }
    
    const commandInBin = "111" + compToBin[comp] + destToBin[dest] + jumpToBin[jump];

    return commandInBin; 
    
}

function toBinary(num) {
    const bin = (num >>> 0).toString(2);
    return "0".repeat(15-bin.length) + bin;
}

function replaceSymbols(commands) {
    let variableAddress = 16;
    
    for (let i = 0; i < commands.length; i++) {
        const command = commands[i];

        if (command[0] === "@") {
            const contents = command.slice(1);

            if (isNaN(+contents)) {
                if (!(symblolicTable[contents]) == true) {
                    symblolicTable[contents] = `${variableAddress}`;
                    variableAddress++;
                }

                commands[i] = "@" + symblolicTable[contents];
            }
        }
    }
}

function getCommands(file) {
    const commands = [];

    let ignore = false;
    let command = "";

    for (let i = 0; i < file.length; i++) {
        const c = file[i];

        if (c === "/") {
            ignore = true;
        } else if (c == "\n") {
            ignore = false;

            if (command) {
                if (command[0] === "(") {
                    symblolicTable[command.slice(1, command.length-1)] = `${commands.length}`;
                } else {
                    commands.push(command);
                }    
            }
        
            command = "";
        }
       
        if (ignore === false && c !== " " && c !== "\n") {
            command += c;
        }
   
    }
    
    if (command) {
        commands.push(command);
    }

    return commands;
}
