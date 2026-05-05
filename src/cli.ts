#!/usr/bin/env node
import { runStandalone } from "./command-registration.js";

process.exitCode = await runStandalone(process.argv);
