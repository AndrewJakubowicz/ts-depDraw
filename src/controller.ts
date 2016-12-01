/**
 * Author: Andrew Jakubowicz
 * 
 * This file controls everything.
 */

import * as ts from "TypeScript";

import * as tokenScanner from "./tokenScanner";
import * as winston from "./appLogger";

/**
 * Interface for the graph nodes.
 */
interface DepNode {
    file: string,
    tokenText: string,
    line: number,
    offset: number
}

