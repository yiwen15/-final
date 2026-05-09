using System;
using System.IO;

class Program {
    static void Main() {
        string text = File.ReadAllText("app.js");
        int count = 0;
        int line = 1;
        bool inString = false;
        char stringChar = ' ';
        bool inLineComment = false;
        bool inBlockComment = false;

        for (int i = 0; i < text.Length; i++) {
            char c = text[i];
            char next = i + 1 < text.Length ? text[i+1] : ' ';
            char prev = i > 0 ? text[i-1] : ' ';

            if (c == '\n') { line++; inLineComment = false; continue; }
            if (inLineComment) continue;
            if (inBlockComment) {
                if (c == '*' && next == '/') { inBlockComment = false; i++; }
                continue;
            }
            if (inString) {
                if (c == '\\') { i++; continue; }
                if (c == stringChar) inString = false;
                continue;
            }
            if (c == '\'' || c == '"' || c == '`') {
                inString = true;
                stringChar = c;
                continue;
            }
            if (c == '/' && next == '/') { inLineComment = true; i++; continue; }
            if (c == '/' && next == '*') { inBlockComment = true; i++; continue; }

            if (c == '{') count++;
            if (c == '}') {
                count--;
                if (count < 0) {
                    Console.WriteLine("Unbalanced } at line " + line);
                    count = 0;
                }
            }
        }
        Console.WriteLine("Final count: " + count);
    }
}
