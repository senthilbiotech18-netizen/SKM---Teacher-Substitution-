/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Clock, Calendar, Printer, RotateCcw, CheckCircle2, ArrowRight, Plus, Trash2, UserPlus, Download, Laptop, Monitor, X, Info, Cloud, CloudCheck, WifiOff, RefreshCw, Lock, ShieldAlert, Key, AlertTriangle } from 'lucide-react';
import { db, doc, onSnapshot, setDoc } from './lib/firebase';

// --- Constants & Data ---

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const;
type Day = typeof DAYS[number];

const PERIODS_13 = [
  { label: 'P1', time: '8:55–9:25' },
  { label: 'P2', time: '9:25–10:05' },
  { label: 'P3', time: '10:05–10:45' },
  { label: 'BREAK', time: '10:45–11:00', isBreak: true },
  { label: 'P4', time: '11:00–11:40' },
  { label: 'P5', time: '11:40–12:15' },
  { label: 'P6', time: '12:15–12:50' },
  { label: 'LUNCH', time: '12:50–13:30', isBreak: true },
  { label: 'P7', time: '13:30–14:15' },
];

const PERIODS_45 = [
  { label: 'P1', time: '8:55–9:50' },
  { label: 'P2', time: '9:50–10:45' },
  { label: 'BREAK', time: '10:45–11:00', isBreak: true },
  { label: 'P3', time: '11:00–11:55' },
  { label: 'P4', time: '11:55–12:50' },
  { label: 'LUNCH', time: '12:50–13:35', isBreak: true },
  { label: 'P5', time: '13:35–14:25' },
  { label: 'P6', time: '14:25–15:15' },
];

const TEACHERS = [
  { name: "SKM", init: "AR", subj: "Biology/IS", isHomeBlock: true },
  { name: "RJ", init: "BS", subj: "Mathematics", isHomeBlock: true },
  { name: "SKG", init: "CM", subj: "Mathematics", isHomeBlock: false },
  { name: "ARCHANA", init: "DK", subj: "IH", isHomeBlock: true },
  { name: "OKT", init: "EP", subj: "IH", isHomeBlock: true },
  { name: "SSQ", init: "FZ", subj: "IH", isHomeBlock: true },
  { name: "SNR", init: "GT", subj: "IH", isHomeBlock: false },
  { name: "RTH", init: "HL", subj: "IH", isHomeBlock: false },
  { name: "NVP", init: "IV", subj: "Science", isHomeBlock: true },
  { name: "SMA", init: "JN", subj: "Science", isHomeBlock: true },
  { name: "SGM", init: "KR", subj: "English", isHomeBlock: true },
  { name: "CDS", init: "LS", subj: "English", isHomeBlock: true },
  { name: "AKS", init: "MP", subj: "English", isHomeBlock: true },
  { name: "LYT", init: "NC", subj: "Chemistry", isHomeBlock: true },
  { name: "KR", init: "OB", subj: "Chemistry/IS", isHomeBlock: true },
  { name: "KGR", init: "PD", subj: "Physics/IS", isHomeBlock: false },
  { name: "AR", init: "QM", subj: "Physics", isHomeBlock: false },
  { name: "BM", init: "RG", subj: "Hindi", isHomeBlock: false },
  { name: "Manjusha", init: "SK", subj: "Hindi", isHomeBlock: false },
  { name: "ALB", init: "TV", subj: "Spanish", isHomeBlock: true },
  { name: "Shekar ", init: "UJ", subj: "Spanish", isHomeBlock: false },
  { name: "Sundar", init: "VR", subj: "French", isHomeBlock: false },
  { name: "Akula", init: "WA", subj: "French", isHomeBlock: false },
  { name: "Anitha", init: "XP", subj: "French", isHomeBlock: false },
  { name: "SYB", init: "YS", subj: "Theatre", isHomeBlock: true },
  { name: "VDR", init: "ZF", subj: "Visual Arts ", isHomeBlock: true },
  { name: "ETA", init: "AK", subj: "Product Design ", isHomeBlock: true },
  { name: "MDN", init: "MD", subj: "Digital Design", isHomeBlock: true },
  { name: "AVS", init: "AV", subj: "Digital Design", isHomeBlock: true },
  { name: "MSK", init: "MS", subj: "Digital Design", isHomeBlock: true }
];

// --- Hardcoded Initial State (User's Export) ---
const INITIAL_TIMETABLES = {
  "t-0": {
    "Monday": { "myp13": [1, 1, 1, 0, 1, 0, 0], "myp45": [0, 1, 1, 0, 1, 1] },
    "Tuesday": { "myp13": [0, 1, 1, 0, 1, 1, 0], "myp45": [1, 1, 1, 0, 1, 1] },
    "Wednesday": { "myp13": [0, 1, 1, 0, 1, 1, 0], "myp45": [1, 1, 1, 1, 1, 1] },
    "Thursday": { "myp13": [0, 1, 0, 1, 0, 0, 0], "myp45": [0, 0, 1, 0, 1, 1] },
    "Friday": { "myp13": [0, 1, 1, 0, 1, 1, 0], "myp45": [0, 1, 1, 1, 0, 0] }
  },
  "t-1": {
    "Monday": { "myp13": [0, 0, 0, 1, 0, 1, 0], "myp45": [0, 1, 1, 0, 1, 1] },
    "Tuesday": { "myp13": [0, 1, 1, 0, 1, 1, 0], "myp45": [1, 1, 1, 1, 0, 0] },
    "Wednesday": { "myp13": [0, 1, 0, 1, 0, 0, 0], "myp45": [0, 1, 1, 0, 1, 1] },
    "Thursday": { "myp13": [0, 1, 1, 0, 1, 1, 0], "myp45": [0, 1, 1, 0, 1, 1] },
    "Friday": { "myp13": [0, 1, 1, 0, 1, 1, 0], "myp45": [0, 1, 0, 1, 0, 0] }
  },
  "t-2": {
    "Monday": { "myp13": [0, 0, 1, 1, 1, 0, 0], "myp45": [0, 1, 1, 0, 1, 1] },
    "Tuesday": { "myp13": [0, 1, 0, 1, 0, 0, 0], "myp45": [1, 1, 0, 1, 1, 0] },
    "Wednesday": { "myp13": [0, 1, 1, 0, 1, 1, 0], "myp45": [0, 1, 0, 1, 0, 0] },
    "Thursday": { "myp13": [0, 1, 1, 0, 1, 1, 0], "myp45": [0, 1, 1, 0, 1, 1] },
    "Friday": { "myp13": [0, 1, 0, 1, 0, 0, 0], "myp45": [0, 1, 1, 0, 1, 1] }
  },
  "t-3": {
    "Monday": { "myp13": [0, 1, 0, 1, 0, 0, 0], "myp45": [0, 1, 0, 1, 0, 0] },
    "Tuesday": { "myp13": [0, 1, 1, 0, 1, 1, 0], "myp45": [1, 0, 0, 0, 0, 0] },
    "Wednesday": { "myp13": [0, 1, 1, 0, 1, 1, 0], "myp45": [0, 1, 1, 0, 1, 1] },
    "Thursday": { "myp13": [0, 1, 0, 1, 0, 0, 0], "myp45": [0, 1, 0, 1, 0, 0] },
    "Friday": { "myp13": [0, 1, 1, 0, 1, 1, 0], "myp45": [0, 1, 1, 0, 1, 1] }
  },
  "t-4": {
    "Monday": { "myp13": [0, 1, 1, 0, 1, 1, 0], "myp45": [0, 1, 1, 0, 1, 1] },
    "Tuesday": { "myp13": [0, 1, 1, 0, 1, 1, 0], "myp45": [1, 1, 1, 1, 0, 0] },
    "Wednesday": { "myp13": [0, 1, 0, 1, 0, 0, 0], "myp45": [0, 1, 1, 0, 1, 1] },
    "Thursday": { "myp13": [0, 1, 1, 0, 1, 1, 0], "myp45": [0, 1, 1, 0, 1, 1] },
    "Friday": { "myp13": [0, 1, 1, 0, 1, 1, 0], "myp45": [0, 1, 0, 1, 0, 0] }
  },
  "t-5": {
    "Monday": { "myp13": [0, 1, 1, 0, 1, 1, 0], "myp45": [0, 1, 1, 0, 1, 1] },
    "Tuesday": { "myp13": [0, 1, 0, 1, 0, 0, 0], "myp45": [0, 1, 0, 1, 0, 1] },
    "Wednesday": { "myp13": [0, 1, 1, 0, 1, 1, 0], "myp45": [0, 1, 0, 1, 0, 0] },
    "Thursday": { "myp13": [0, 1, 1, 0, 1, 1, 0], "myp45": [0, 1, 1, 0, 1, 1] },
    "Friday": { "myp13": [0, 1, 0, 1, 0, 0, 0], "myp45": [0, 1, 1, 0, 1, 1] }
  },
  "t-6": {
    "Monday": { "myp13": [0, 1, 0, 1, 0, 0, 0], "myp45": [0, 1, 0, 1, 0, 0] },
    "Tuesday": { "myp13": [0, 1, 1, 0, 1, 1, 0], "myp45": [0, 1, 1, 0, 1, 1] },
    "Wednesday": { "myp13": [0, 1, 1, 0, 1, 1, 0], "myp45": [0, 1, 1, 0, 1, 1] },
    "Thursday": { "myp13": [0, 1, 0, 1, 0, 0, 0], "myp45": [0, 1, 0, 1, 0, 0] },
    "Friday": { "myp13": [0, 1, 1, 0, 1, 1, 0], "myp45": [0, 1, 1, 0, 1, 1] }
  },
  "t-7": {
    "Monday": { "myp13": [0, 1, 1, 0, 1, 1, 0], "myp45": [0, 1, 1, 0, 1, 1] },
    "Tuesday": { "myp13": [0, 1, 1, 0, 1, 1, 0], "myp45": [0, 1, 0, 1, 0, 0] },
    "Wednesday": { "myp13": [0, 1, 0, 1, 0, 0, 0], "myp45": [0, 1, 1, 0, 1, 1] },
    "Thursday": { "myp13": [0, 1, 1, 0, 1, 1, 0], "myp45": [0, 1, 1, 0, 1, 1] },
    "Friday": { "myp13": [0, 1, 1, 0, 1, 1, 0], "myp45": [0, 1, 0, 1, 0, 0] }
  },
  "t-8": {
    "Monday": { "myp13": [0, 1, 1, 0, 1, 1, 0], "myp45": [0, 1, 1, 0, 1, 1] },
    "Tuesday": { "myp13": [0, 1, 0, 1, 0, 0, 0], "myp45": [1, 1, 1, 1, 1, 1] },
    "Wednesday": { "myp13": [0, 1, 1, 0, 1, 1, 0], "myp45": [0, 1, 0, 1, 0, 0] },
    "Thursday": { "myp13": [0, 1, 1, 0, 1, 1, 0], "myp45": [0, 1, 1, 0, 1, 1] },
    "Friday": { "myp13": [0, 1, 0, 1, 0, 0, 0], "myp45": [0, 1, 1, 0, 1, 1] }
  },
  "t-9": {
    "Monday": { "myp13": [0, 1, 0, 1, 0, 0, 0], "myp45": [0, 1, 0, 1, 0, 0] },
    "Tuesday": { "myp13": [0, 1, 1, 0, 1, 1, 0], "myp45": [1, 0, 1, 1, 1, 0] },
    "Wednesday": { "myp13": [0, 1, 1, 0, 1, 1, 0], "myp45": [0, 1, 1, 0, 1, 1] },
    "Thursday": { "myp13": [0, 1, 0, 1, 0, 0, 0], "myp45": [0, 1, 0, 1, 0, 0] },
    "Friday": { "myp13": [0, 1, 1, 0, 1, 1, 0], "myp45": [0, 1, 1, 0, 1, 1] }
  },
  "t-10": {
    "Monday": { "myp13": [0, 1, 1, 0, 1, 1, 0], "myp45": [0, 1, 1, 0, 1, 1] },
    "Tuesday": { "myp13": [0, 1, 1, 0, 1, 1, 0], "myp45": [1, 1, 1, 1, 0, 0] },
    "Wednesday": { "myp13": [0, 1, 0, 1, 0, 0, 0], "myp45": [0, 1, 1, 0, 1, 1] },
    "Thursday": { "myp13": [0, 1, 1, 0, 1, 1, 0], "myp45": [0, 1, 1, 0, 1, 1] },
    "Friday": { "myp13": [0, 1, 1, 0, 1, 1, 0], "myp45": [0, 1, 0, 1, 0, 0] }
  },
  "t-11": {
    "Monday": { "myp13": [0, 1, 1, 0, 1, 1, 0], "myp45": [0, 1, 1, 0, 1, 1] },
    "Tuesday": { "myp13": [0, 1, 0, 1, 0, 0, 0], "myp45": [1, 0, 0, 1, 1, 1] },
    "Wednesday": { "myp13": [0, 1, 1, 0, 1, 1, 0], "myp45": [0, 1, 0, 1, 0, 0] },
    "Thursday": { "myp13": [0, 1, 1, 0, 1, 1, 0], "myp45": [0, 1, 1, 0, 1, 1] },
    "Friday": { "myp13": [0, 1, 0, 1, 0, 0, 0], "myp45": [0, 1, 1, 0, 1, 1] }
  },
  "t-12": {
    "Monday": { "myp13": [0, 1, 0, 1, 0, 0, 0], "myp45": [0, 1, 0, 1, 0, 0] },
    "Tuesday": { "myp13": [0, 1, 1, 0, 1, 1, 0], "myp45": [1, 1, 1, 1, 1, 1] },
    "Wednesday": { "myp13": [0, 1, 1, 0, 1, 1, 0], "myp45": [0, 1, 1, 0, 1, 1] },
    "Thursday": { "myp13": [0, 1, 0, 1, 0, 0, 0], "myp45": [0, 1, 0, 1, 0, 0] },
    "Friday": { "myp13": [0, 1, 1, 0, 1, 1, 0], "myp45": [0, 1, 1, 0, 1, 1] }
  },
  "t-13": {
    "Monday": { "myp13": [0, 1, 1, 0, 1, 1, 0], "myp45": [0, 1, 1, 0, 1, 1] },
    "Tuesday": { "myp13": [0, 1, 1, 0, 1, 1, 0], "myp45": [1, 1, 0, 0, 0, 1] },
    "Wednesday": { "myp13": [0, 1, 0, 1, 0, 0, 0], "myp45": [0, 1, 1, 0, 1, 1] },
    "Thursday": { "myp13": [0, 1, 1, 0, 1, 1, 0], "myp45": [0, 1, 1, 0, 1, 1] },
    "Friday": { "myp13": [0, 1, 1, 0, 1, 1, 0], "myp45": [0, 1, 0, 1, 0, 0] }
  },
  "t-14": {
    "Monday": { "myp13": [0, 1, 1, 0, 1, 1, 0], "myp45": [0, 1, 1, 0, 1, 1] },
    "Tuesday": { "myp13": [0, 1, 0, 1, 0, 0, 0], "myp45": [1, 1, 1, 0, 0, 0] },
    "Wednesday": { "myp13": [0, 1, 1, 0, 1, 1, 0], "myp45": [0, 1, 0, 1, 0, 0] },
    "Thursday": { "myp13": [0, 1, 1, 0, 1, 1, 0], "myp45": [0, 1, 1, 0, 1, 1] },
    "Friday": { "myp13": [0, 1, 0, 1, 0, 0, 0], "myp45": [0, 1, 1, 0, 1, 1] }
  },
  "t-15": {
    "Monday": { "myp13": [0, 1, 0, 1, 0, 0, 0], "myp45": [0, 1, 0, 1, 0, 0] },
    "Tuesday": { "myp13": [0, 1, 1, 0, 1, 1, 0], "myp45": [0, 0, 1, 0, 1, 0] },
    "Wednesday": { "myp13": [0, 1, 1, 0, 1, 1, 0], "myp45": [0, 1, 1, 0, 1, 1] },
    "Thursday": { "myp13": [0, 1, 0, 1, 0, 0, 0], "myp45": [0, 1, 0, 1, 0, 0] },
    "Friday": { "myp13": [0, 1, 1, 0, 1, 1, 0], "myp45": [0, 1, 1, 0, 1, 1] }
  },
  "t-16": {
    "Monday": { "myp13": [0, 1, 1, 0, 1, 1, 0], "myp45": [0, 1, 1, 0, 1, 1] },
    "Tuesday": { "myp13": [0, 1, 1, 0, 1, 1, 0], "myp45": [1, 1, 1, 1, 0, 0] },
    "Wednesday": { "myp13": [0, 1, 0, 1, 0, 0, 0], "myp45": [0, 1, 1, 0, 1, 1] },
    "Thursday": { "myp13": [0, 1, 1, 0, 1, 1, 0], "myp45": [0, 1, 1, 0, 1, 1] },
    "Friday": { "myp13": [0, 1, 1, 0, 1, 1, 0], "myp45": [0, 1, 0, 1, 0, 0] }
  },
  "t-17": {
    "Monday": { "myp13": [0, 1, 1, 0, 1, 1, 0], "myp45": [0, 1, 1, 0, 1, 1] },
    "Tuesday": { "myp13": [0, 1, 1, 1, 0, 0, 0], "myp45": [1, 1, 0, 0, 0, 1] },
    "Wednesday": { "myp13": [0, 1, 1, 0, 1, 1, 0], "myp45": [0, 1, 0, 1, 0, 0] },
    "Thursday": { "myp13": [0, 1, 1, 0, 1, 1, 0], "myp45": [0, 1, 1, 0, 1, 1] },
    "Friday": { "myp13": [0, 1, 0, 1, 0, 0, 0], "myp45": [0, 1, 1, 0, 1, 1] }
  },
  "t-18": {
    "Monday": { "myp13": [0, 1, 0, 1, 0, 0, 0], "myp45": [0, 1, 0, 1, 0, 0] },
    "Tuesday": { "myp13": [0, 1, 1, 0, 1, 1, 0], "myp45": [1, 1, 1, 1, 1, 1] },
    "Wednesday": { "myp13": [0, 1, 1, 0, 1, 1, 0], "myp45": [0, 1, 1, 0, 1, 1] },
    "Thursday": { "myp13": [0, 1, 0, 1, 0, 0, 0], "myp45": [0, 1, 0, 1, 0, 0] },
    "Friday": { "myp13": [0, 1, 1, 0, 1, 1, 0], "myp45": [0, 1, 1, 0, 1, 1] }
  },
  "t-19": {
    "Monday": { "myp13": [0, 1, 1, 0, 1, 1, 0], "myp45": [0, 1, 1, 0, 1, 1] },
    "Tuesday": { "myp13": [0, 1, 1, 0, 1, 1, 0], "myp45": [1, 1, 1, 1, 1, 1] },
    "Wednesday": { "myp13": [0, 1, 0, 1, 0, 0, 0], "myp45": [0, 1, 1, 0, 1, 1] },
    "Thursday": { "myp13": [0, 1, 1, 0, 1, 1, 0], "myp45": [0, 1, 1, 0, 1, 1] },
    "Friday": { "myp13": [0, 1, 1, 0, 1, 1, 0], "myp45": [0, 1, 0, 1, 0, 0] }
  },
  "t-20": {
    "Monday": { "myp13": [0, 1, 1, 0, 1, 1, 0], "myp45": [0, 1, 1, 0, 1, 1] },
    "Tuesday": { "myp13": [0, 1, 1, 1, 0, 0, 0], "myp45": [0, 1, 0, 1, 0, 1] },
    "Wednesday": { "myp13": [0, 1, 1, 0, 1, 1, 0], "myp45": [0, 1, 0, 1, 0, 0] },
    "Thursday": { "myp13": [0, 1, 1, 0, 1, 1, 0], "myp45": [0, 1, 1, 0, 1, 1] },
    "Friday": { "myp13": [0, 1, 0, 1, 0, 0, 0], "myp45": [0, 1, 1, 0, 1, 1] }
  },
  "t-21": {
    "Monday": { "myp13": [0, 1, 0, 1, 0, 0, 0], "myp45": [0, 1, 0, 1, 0, 0] },
    "Tuesday": { "myp13": [0, 1, 1, 0, 1, 1, 0], "myp45": [0, 1, 0, 1, 0, 1] },
    "Wednesday": { "myp13": [0, 1, 1, 0, 1, 1, 0], "myp45": [0, 1, 1, 0, 1, 1] },
    "Thursday": { "myp13": [0, 1, 0, 1, 0, 0, 0], "myp45": [0, 1, 0, 1, 0, 0] },
    "Friday": { "myp13": [0, 1, 1, 0, 1, 1, 0], "myp45": [0, 1, 1, 0, 1, 1] }
  },
  "t-22": {
    "Monday": { "myp13": [0, 1, 1, 0, 1, 1, 0], "myp45": [0, 1, 1, 0, 1, 1] },
    "Tuesday": { "myp13": [0, 1, 1, 0, 1, 1, 0], "myp45": [0, 1, 0, 0, 0, 0] },
    "Wednesday": { "myp13": [0, 1, 0, 1, 0, 0, 0], "myp45": [0, 1, 1, 0, 1, 1] },
    "Thursday": { "myp13": [0, 1, 1, 0, 1, 1, 0], "myp45": [0, 1, 1, 0, 1, 1] },
    "Friday": { "myp13": [0, 1, 1, 0, 1, 1, 0], "myp45": [0, 1, 0, 1, 0, 0] }
  },
  "t-23": {
    "Monday": { "myp13": [0, 1, 1, 0, 1, 1, 0], "myp45": [0, 1, 1, 0, 1, 1] },
    "Tuesday": { "myp13": [0, 1, 1, 1, 0, 0, 0], "myp45": [0, 1, 0, 0, 0, 0] },
    "Wednesday": { "myp13": [0, 1, 1, 0, 1, 1, 0], "myp45": [0, 1, 0, 1, 0, 0] },
    "Thursday": { "myp13": [0, 1, 1, 0, 1, 1, 0], "myp45": [0, 1, 1, 0, 1, 1] },
    "Friday": { "myp13": [0, 1, 0, 1, 0, 0, 0], "myp45": [0, 1, 1, 0, 1, 1] }
  },
  "t-24": {
    "Monday": { "myp13": [0, 1, 0, 1, 0, 0, 0], "myp45": [0, 1, 0, 1, 0, 0] },
    "Tuesday": { "myp13": [0, 1, 1, 0, 1, 1, 0], "myp45": [1, 1, 1, 1, 1, 1] },
    "Wednesday": { "myp13": [0, 1, 1, 0, 1, 1, 0], "myp45": [0, 1, 1, 0, 1, 1] },
    "Thursday": { "myp13": [0, 1, 0, 1, 0, 0, 0], "myp45": [0, 1, 0, 1, 0, 0] },
    "Friday": { "myp13": [0, 1, 1, 0, 1, 1, 0], "myp45": [0, 1, 1, 0, 1, 1] }
  },
  "t-25": {
    "Monday": { "myp13": [0, 1, 1, 0, 1, 1, 0], "myp45": [0, 1, 1, 0, 1, 1] },
    "Tuesday": { "myp13": [0, 1, 1, 0, 1, 1, 0], "myp45": [1, 0, 1, 1, 1, 0] },
    "Wednesday": { "myp13": [0, 1, 0, 1, 0, 0, 0], "myp45": [0, 1, 1, 0, 1, 1] },
    "Thursday": { "myp13": [0, 1, 1, 0, 1, 1, 0], "myp45": [0, 1, 1, 0, 1, 1] },
    "Friday": { "myp13": [0, 1, 1, 0, 1, 1, 0], "myp45": [0, 1, 0, 1, 0, 0] }
  },
  "t-26": {
    "Monday": { "myp13": [0, 1, 1, 0, 1, 1, 0], "myp45": [0, 1, 1, 0, 1, 1] },
    "Tuesday": { "myp13": [0, 1, 0, 1, 0, 0, 0], "myp45": [0, 0, 1, 1, 1, 1] },
    "Wednesday": { "myp13": [0, 1, 1, 0, 1, 1, 0], "myp45": [0, 1, 0, 1, 0, 0] },
    "Thursday": { "myp13": [0, 1, 1, 0, 1, 1, 0], "myp45": [0, 1, 1, 0, 1, 1] },
    "Friday": { "myp13": [0, 1, 0, 1, 0, 0, 0], "myp45": [0, 1, 1, 0, 1, 1] }
  },
  "t-27": {
    "Monday": { "myp13": [0, 1, 0, 1, 0, 0, 0], "myp45": [0, 1, 0, 1, 0, 0] },
    "Tuesday": { "myp13": [0, 1, 1, 0, 1, 1, 0], "myp45": [1, 0, 1, 1, 0, 0] },
    "Wednesday": { "myp13": [0, 1, 1, 0, 1, 1, 0], "myp45": [0, 1, 1, 0, 1, 1] },
    "Thursday": { "myp13": [0, 1, 0, 1, 0, 0, 0], "myp45": [0, 1, 0, 1, 0, 0] },
    "Friday": { "myp13": [0, 1, 1, 0, 1, 1, 0], "myp45": [0, 1, 1, 0, 1, 1] }
  },
  "t-28": {
    "Monday": { "myp13": [0, 1, 1, 0, 1, 1, 0], "myp45": [0, 1, 1, 0, 1, 1] },
    "Tuesday": { "myp13": [0, 1, 1, 0, 1, 1, 0], "myp45": [0, 0, 0, 0, 0, 0] },
    "Wednesday": { "myp13": [0, 1, 0, 1, 0, 0, 0], "myp45": [0, 1, 1, 0, 1, 1] },
    "Thursday": { "myp13": [0, 1, 1, 0, 1, 1, 0], "myp45": [0, 1, 1, 0, 1, 1] },
    "Friday": { "myp13": [0, 1, 1, 0, 1, 1, 0], "myp45": [0, 1, 0, 1, 0, 0] }
  },
  "t-29": {
    "Monday": { "myp13": [0, 1, 1, 0, 1, 1, 0], "myp45": [0, 1, 1, 0, 1, 1] },
    "Tuesday": { "myp13": [0, 1, 0, 1, 0, 0, 0], "myp45": [0, 0, 1, 0, 0, 0] },
    "Wednesday": { "myp13": [0, 1, 1, 0, 1, 1, 0], "myp45": [0, 1, 0, 1, 0, 0] },
    "Thursday": { "myp13": [0, 1, 1, 0, 1, 1, 0], "myp45": [0, 1, 1, 0, 1, 1] },
    "Friday": { "myp13": [0, 1, 0, 1, 0, 0, 0], "myp45": [0, 1, 1, 0, 1, 1] }
  }
};

const createAllFreeTimetables = (teachersList: any[]) => {
  const freeTT: Record<string, any> = {};
  teachersList.forEach(t => {
    const daysObj: Record<string, any> = {};
    DAYS.forEach(day => {
      daysObj[day] = {
        myp13: [0, 0, 0, 0, 0, 0, 0],
        myp45: [0, 0, 0, 0, 0, 0]
      };
    });
    freeTT[t.id] = daysObj;
  });
  return freeTT;
};

// --- App Component ---

function parseTime(timeStr: string) {
  const [h, m] = timeStr.trim().split(':').map(Number);
  return h * 60 + m;
}

function parseRange(rangeStr: string) {
  const parts = rangeStr.split(/[–-]/);
  return {
    start: parseTime(parts[0]),
    end: parseTime(parts[1])
  };
}

function rangesOverlap(r1: { start: number, end: number }, r2: { start: number, end: number }) {
  return r1.start < r2.end && r2.start < r1.end;
}

function genSchedule(teacherIdx: number, numSlots: number) {
  const seed = teacherIdx * 31 + numSlots * 7;
  const slots = [];
  for (let i = 0; i < numSlots; i++) {
    slots.push(((seed * (i + 3) * 17 + i * 13) % 3 === 0) ? 0 : 1);
  }
  let frees = slots.filter(x => x === 0).length;
  let busys = slots.filter(x => x === 1).length;
  if (frees < 2) { slots[0] = 0; slots[2] = 0; }
  if (busys < 2) { slots[1] = 1; slots[3] = 1; }
  return slots;
}

// Generate fallback base timetables
const TT13_BASE = Object.fromEntries(TEACHERS.map((t, i) => [t.name, genSchedule(i, 7)]));
const TT45_BASE = Object.fromEntries(TEACHERS.map((t, i) => [t.name, genSchedule(i + 100, 6)]));

// Increment this version whenever we hardcode new data to force the browser to update
const APP_DATA_VERSION = '2026-04-21-v3-sections';

export default function App() {
  const [teachers, setTeachers] = useState<Array<{ 
    id: string; 
    name: string; 
    init: string; 
    subj: string; 
    isHomeBlock: boolean;
    teachesMYP13: boolean;
    teachesMYP45: boolean;
  }>>(() => {
    const savedVersion = localStorage.getItem('tsf_version');
    const base = TEACHERS.map((t, i) => ({ 
      ...t, 
      id: `t-${i}`,
      teachesMYP13: true, // Default to true, user can toggle
      teachesMYP45: true  // Default to true, user can toggle
    }));

    // If version mismatch, ignore local storage once and use hardcoded data
    if (savedVersion !== APP_DATA_VERSION) {
      localStorage.removeItem('tsf_teachers');
      localStorage.removeItem('tsf_timetables');
      localStorage.setItem('tsf_version', APP_DATA_VERSION);
      return base;
    }

    const saved = localStorage.getItem('tsf_teachers');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.length < base.length) {
        return [...parsed, ...base.slice(parsed.length)];
      }
      return parsed;
    }
    return base;
  });

  const [timetables, setTimetables] = useState<Record<string, Record<Day, { myp13: number[], myp45: number[] }>>>(() => {
    const savedVersion = localStorage.getItem('tsf_version');
    const defaultData = INITIAL_TIMETABLES as any;

    // If version mismatch, force hardcoded timetables
    if (savedVersion !== APP_DATA_VERSION) {
      return defaultData;
    }

    const saved = localStorage.getItem('tsf_timetables');
    const parsed = saved ? JSON.parse(saved) : {};
    
    // Ensure every teacher in the current list has a timetable entry
    teachers.forEach((t, i) => {
      if (!parsed[t.id]) {
        if (defaultData[t.id]) {
          parsed[t.id] = defaultData[t.id];
        } else {
          parsed[t.id] = {};
          DAYS.forEach((day, dIdx) => {
            parsed[t.id][day] = {
              myp13: genSchedule(i + dIdx * 7, 7),
              myp45: genSchedule(i + dIdx * 11 + 100, 6)
            };
          });
        }
      }
    });

    return parsed;
  });

  // Ensure all teachers have timetables (sync missing ones if teacher list grows)
  useEffect(() => {
    setTimetables(prev => {
      let changed = false;
      const next = { ...prev };
      const defaultData = INITIAL_TIMETABLES as any;

      teachers.forEach((t, i) => {
        if (!next[t.id]) {
          changed = true;
          if (defaultData[t.id]) {
            next[t.id] = defaultData[t.id];
          } else {
            next[t.id] = {} as any;
            DAYS.forEach((day, dIdx) => {
              next[t.id][day] = {
                myp13: genSchedule(i + dIdx * 7, 7),
                myp45: genSchedule(i + dIdx * 11 + 100, 6)
              };
            });
          }
        }
      });
      return changed ? next : prev;
    });
  }, [teachers]);

  const [selectedDay, setSelectedDay] = useState<Day>('Monday');
  const [isEditMode, setIsEditMode] = useState(false);
  const [absentTeacher, setAbsentTeacher] = useState('');
  const [ttGroup, setTtGroup] = useState<'myp13' | 'myp45'>('myp13');
  const [periodIdx, setPeriodIdx] = useState<number | ''>('');
  const [assignments, setAssignments] = useState<Record<string, Record<string, boolean>>>({});
  const [assignmentLog, setAssignmentLog] = useState<Array<{
    absent: string;
    sub: string;
    group: string;
    periodLabel: string;
    periodTime: string;
    day: Day;
  }>>([]);
  const [activeTab, setActiveTab] = useState<'myp13' | 'myp45'>('myp13');
  const [selectedSub, setSelectedSub] = useState('');

  // Firebase Cloud Sync State
  const [syncStatus, setSyncStatus] = useState<'syncing' | 'synced' | 'saving' | 'error' | 'offline'>('syncing');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const isInitialSnapshotDone = useRef(false);

  // Firestore Real-time Listener across all staff devices
  useEffect(() => {
    setSyncStatus('syncing');
    const schoolDocRef = doc(db, 'app_state', 'school');

    const unsubscribe = onSnapshot(
      schoolDocRef,
      async (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data.teachers && Array.isArray(data.teachers) && data.teachers.length > 0) {
            setTeachers(data.teachers);
          }
          if (data.timetables && typeof data.timetables === 'object') {
            setTimetables(data.timetables);
          }
          if (data.assignments && typeof data.assignments === 'object') {
            setAssignments(data.assignments);
          }
          if (data.assignmentLog && Array.isArray(data.assignmentLog)) {
            setAssignmentLog(data.assignmentLog);
          }
          setSyncStatus('synced');
          setLastSyncTime(new Date());
          isInitialSnapshotDone.current = true;
        } else {
          // Initialize central Firestore database with default teachers and timetables if empty
          const baseTeachers = TEACHERS.map((t, i) => ({ 
            ...t, 
            id: `t-${i}`,
            teachesMYP13: true,
            teachesMYP45: true
          }));
          const initialData = {
            teachers: baseTeachers,
            timetables: INITIAL_TIMETABLES,
            assignments: {},
            assignmentLog: [],
            lastUpdated: new Date().toISOString()
          };
          try {
            await setDoc(schoolDocRef, initialData);
            setTeachers(baseTeachers);
            setTimetables(INITIAL_TIMETABLES as any);
            setSyncStatus('synced');
            setLastSyncTime(new Date());
            isInitialSnapshotDone.current = true;
          } catch (err) {
            console.error("Failed to seed initial Firestore data:", err);
            setSyncStatus('error');
          }
        }
      },
      (error) => {
        console.error("Firestore real-time sync error:", error);
        setSyncStatus('offline');
      }
    );

    return () => unsubscribe();
  }, []);

  // Central Helper to Save Changes to Firebase Cloud
  const saveToCloud = async (
    updatedTeachers?: any, 
    updatedTimetables?: any, 
    updatedAssignments?: any, 
    updatedAssignmentLog?: any
  ) => {
    setSyncStatus('saving');
    try {
      const schoolDocRef = doc(db, 'app_state', 'school');
      const payload: any = {
        teachers: updatedTeachers !== undefined ? updatedTeachers : teachers,
        timetables: updatedTimetables !== undefined ? updatedTimetables : timetables,
        assignments: updatedAssignments !== undefined ? updatedAssignments : assignments,
        assignmentLog: updatedAssignmentLog !== undefined ? updatedAssignmentLog : assignmentLog,
        lastUpdated: new Date().toISOString()
      };
      await setDoc(schoolDocRef, payload, { merge: true });
      setSyncStatus('synced');
      setLastSyncTime(new Date());
    } catch (err) {
      console.error("Error saving to Firebase cloud:", err);
      setSyncStatus('error');
    }
  };

  // Add teacher form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTeacherName, setNewTeacherName] = useState('');
  const [newTeacherInit, setNewTeacherInit] = useState('');
  const [newTeacherSubj, setNewTeacherSubj] = useState('');
  const [newTeacherIsHomeBlock, setNewTeacherIsHomeBlock] = useState(true);
  const [newTeacherTeachesMYP13, setNewTeacherTeachesMYP13] = useState(true);
  const [newTeacherTeachesMYP45, setNewTeacherTeachesMYP45] = useState(true);

  // Admin Reset & Password Modal State
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetPasswordInput, setResetPasswordInput] = useState('');
  const [resetPasswordError, setResetPasswordError] = useState('');
  const [resetSuccessNotice, setResetSuccessNotice] = useState('');
  const [resetMode, setResetMode] = useState<'all_free' | 'demo'>('all_free');

  const handleOpenResetModal = () => {
    setResetPasswordInput('');
    setResetPasswordError('');
    setResetMode('all_free');
    setShowResetModal(true);
  };

  const executeServerReset = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const inputTrimmed = resetPasswordInput.trim();
    if (inputTrimmed !== 'admin@gsis') {
      setResetPasswordError('Incorrect admin password. Access denied.');
      return;
    }

    setResetPasswordError('');
    setSyncStatus('saving');

    const baseTeachers = TEACHERS.map((t, i) => ({ 
      ...t, 
      id: `t-${i}`,
      teachesMYP13: true,
      teachesMYP45: true
    }));

    const targetTimetables = resetMode === 'all_free'
      ? createAllFreeTimetables(baseTeachers)
      : INITIAL_TIMETABLES;

    const initialData = {
      teachers: baseTeachers,
      timetables: targetTimetables,
      assignments: {},
      assignmentLog: [],
      lastUpdated: new Date().toISOString()
    };

    try {
      const schoolDocRef = doc(db, 'app_state', 'school');
      // Overwrite central Firebase Firestore document directly without merge to wipe old custom data
      await setDoc(schoolDocRef, initialData);

      setTeachers(baseTeachers);
      setTimetables(targetTimetables as any);
      setAssignments({});
      setAssignmentLog([]);

      localStorage.removeItem('tsf_teachers');
      localStorage.removeItem('tsf_timetables');
      localStorage.removeItem('tsf_assignments');
      localStorage.removeItem('tsf_log');

      setSyncStatus('synced');
      setLastSyncTime(new Date());
      setShowResetModal(false);
      setResetPasswordInput('');
      setResetSuccessNotice(
        resetMode === 'all_free'
          ? 'Central Firebase server database reset: ALL class slots set to FREE across all staff members!'
          : 'Central Firebase server database reset to default demo timetable schedule!'
      );
      setTimeout(() => setResetSuccessNotice(''), 8000);
    } catch (err) {
      console.error("Failed to reset Firestore database:", err);
      setResetPasswordError('Firebase error resetting server database. Please check your network connection.');
      setSyncStatus('error');
    }
  };

  // PWA Installation State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);
  const [showInstallGuide, setShowInstallGuide] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode (already installed)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsAppInstalled(true);
    }

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const triggerInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsAppInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      setShowInstallGuide(true);
    }
  };

  // Persistence
  useEffect(() => {
    localStorage.setItem('tsf_teachers', JSON.stringify(teachers));
  }, [teachers]);

  useEffect(() => {
    localStorage.setItem('tsf_timetables', JSON.stringify(timetables));
  }, [timetables]);

  const currentPeriods = ttGroup === 'myp13' ? PERIODS_13 : PERIODS_45;
  const realPeriods = useMemo(() => currentPeriods.filter(p => !p.isBreak), [currentPeriods]);

  const availableSubs = useMemo(() => {
    if (!absentTeacher || periodIdx === '') return [];
    const targetPeriod = realPeriods[Number(periodIdx)];
    const targetRange = parseRange(targetPeriod.time);
    const targetKey = `${selectedDay}_${ttGroup}_${targetPeriod.label}`;

    const filtered = teachers.filter(t => {
      // 1. Only Home Block teachers can be substitutes
      if (!t.isHomeBlock) return false;
      
      // 2. Cannot substitute themselves
      if (t.name === absentTeacher) return false;
      
      // 3. Check if already assigned for this period
      if (assignments[t.id]?.[targetKey]) return false;
      
      const dayTT = timetables[t.id]?.[selectedDay];
      if (!dayTT) return false;

      // 4. Unified Conflict Check: Look for any overlapping "Occupied" periods in BOTH groups
      const allPeriodSets = [
        { periods: PERIODS_13, slots: dayTT.myp13 },
        { periods: PERIODS_45, slots: dayTT.myp45 }
      ];

      for (const set of allPeriodSets) {
        let realIdx = 0;
        for (const p of set.periods) {
          if (p.isBreak) continue;
          
          const currentIdx = realIdx++;
          const isOccupied = set.slots[currentIdx] === 1;
          
          if (isOccupied) {
            const pRange = parseRange(p.time);
            if (rangesOverlap(targetRange, pRange)) {
              return false; // Conflict found!
            }
          }
        }
      }

      return true; // No conflicts, is Home Block staff
    });

    // 5. Enrich with free count for the day and Sort (freest first)
    // The count is calculated based on the 7 lessons of MYP 1-3 or 6 lessons of MYP 4-5
    // depending on the active search tab.
    return filtered.map(t => {
      const dayTT = timetables[t.id]?.[selectedDay];
      if (!dayTT) return { ...t, freeCount: 0 };

      const otherGroup = ttGroup === 'myp13' ? 'myp45' : 'myp13';
      const otherPeriods = ttGroup === 'myp13' ? PERIODS_45 : PERIODS_13;
      
      let freeCount = 0;
      let realIdx = 0;
      for (const p of currentPeriods) {
        if (p.isBreak) continue;
        
        const currentIdx = realIdx++;
        const isFreeInSelf = dayTT[ttGroup][currentIdx] === 0;
        
        if (isFreeInSelf) {
          // Check if overlapping ANY occupied period in the OTHER group
          const pRange = parseRange(p.time);
          let overlapsOtherBusy = false;
          
          let otherRealIdx = 0;
          for (const op of otherPeriods) {
            if (op.isBreak) continue;
            const otherIdx = otherRealIdx++;
            if (dayTT[otherGroup][otherIdx] === 1) {
              const opRange = parseRange(op.time);
              if (rangesOverlap(pRange, opRange)) {
                overlapsOtherBusy = true;
                break;
              }
            }
          }
          
          if (!overlapsOtherBusy) {
            freeCount++;
          }
        }
      }

      return { ...t, freeCount };
    }).sort((a, b) => b.freeCount - a.freeCount);
  }, [absentTeacher, ttGroup, periodIdx, assignments, realPeriods, teachers, timetables, selectedDay, currentPeriods]);

  const handleAssign = () => {
    if (!selectedSub || !absentTeacher || periodIdx === '') return;
    const periodInfo = realPeriods[Number(periodIdx)];
    const key = `${selectedDay}_${ttGroup}_${periodInfo.label}`;
    const subTeacher = teachers.find(t => t.name === selectedSub);
    if (!subTeacher) return;

    const nextAssignments = {
      ...assignments,
      [subTeacher.id]: {
        ...(assignments[subTeacher.id] || {}),
        [key]: true,
      }
    };

    const nextLog = [
      ...assignmentLog,
      {
        absent: absentTeacher,
        sub: selectedSub,
        group: ttGroup === 'myp13' ? 'MYP 1–3' : 'MYP 4–5',
        periodLabel: periodInfo.label,
        periodTime: periodInfo.time,
        day: selectedDay,
      }
    ];

    setAssignments(nextAssignments);
    setAssignmentLog(nextLog);
    saveToCloud(teachers, timetables, nextAssignments, nextLog);

    setAbsentTeacher('');
    setPeriodIdx('');
    setSelectedSub('');
  };

  const handleReset = () => {
    setAbsentTeacher('');
    setPeriodIdx('');
    setSelectedSub('');
  };

  const clearLog = () => {
    setAssignmentLog([]);
    setAssignments({});
    saveToCloud(teachers, timetables, {}, []);
  };

  const handleUpdateTeacher = (
    id: string, 
    name: string, 
    subj: string, 
    isHomeBlock?: boolean, 
    teachesMYP13?: boolean, 
    teachesMYP45?: boolean
  ) => {
    const nextTeachers = teachers.map(t => t.id === id ? { 
      ...t, 
      name, 
      subj, 
      isHomeBlock: isHomeBlock !== undefined ? isHomeBlock : t.isHomeBlock,
      teachesMYP13: teachesMYP13 !== undefined ? teachesMYP13 : t.teachesMYP13,
      teachesMYP45: teachesMYP45 !== undefined ? teachesMYP45 : t.teachesMYP45
    } : t);
    setTeachers(nextTeachers);
    saveToCloud(nextTeachers, timetables, assignments, assignmentLog);
  };

  const handleAddTeacher = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newTeacherName.trim()) return;
    const init = newTeacherInit.trim() || newTeacherName.trim().slice(0, 2).toUpperCase();
    const newId = `t-${Date.now()}`;
    const newT = {
      id: newId,
      name: newTeacherName.trim(),
      init,
      subj: newTeacherSubj.trim() || 'General',
      isHomeBlock: newTeacherIsHomeBlock,
      teachesMYP13: newTeacherTeachesMYP13,
      teachesMYP45: newTeacherTeachesMYP45
    };

    const nextTeachers = [...teachers, newT];
    const newTTForTeacher: any = {};
    DAYS.forEach(day => {
      newTTForTeacher[day] = {
        myp13: [0, 0, 0, 0, 0, 0, 0],
        myp45: [0, 0, 0, 0, 0, 0]
      };
    });
    const nextTimetables = { ...timetables, [newId]: newTTForTeacher };

    setTeachers(nextTeachers);
    setTimetables(nextTimetables);
    saveToCloud(nextTeachers, nextTimetables, assignments, assignmentLog);

    setNewTeacherName('');
    setNewTeacherInit('');
    setNewTeacherSubj('');
    setNewTeacherIsHomeBlock(true);
    setNewTeacherTeachesMYP13(true);
    setNewTeacherTeachesMYP45(true);
    setShowAddForm(false);
  };

  const handleDeleteTeacher = (id: string) => {
    const t = teachers.find(teacher => teacher.id === id);
    const name = t ? t.name : 'this teacher';
    if (window.confirm(`Are you sure you want to delete "${name}" from the teacher list?`)) {
      const nextTeachers = teachers.filter(teacher => teacher.id !== id);
      const nextTimetables = { ...timetables };
      delete nextTimetables[id];

      setTeachers(nextTeachers);
      setTimetables(nextTimetables);
      saveToCloud(nextTeachers, nextTimetables, assignments, assignmentLog);

      if (absentTeacher === name) setAbsentTeacher('');
      if (selectedSub === name) setSelectedSub('');
    }
  };

  const handleToggleSlot = (teacherId: string, group: 'myp13' | 'myp45', idx: number) => {
    const newTT = { ...timetables };
    const teacherTT = { ...newTT[teacherId] };
    const dayTT = { ...teacherTT[selectedDay] };
    const slots = [...dayTT[group]];
    slots[idx] = slots[idx] === 0 ? 1 : 0;
    dayTT[group] = slots;
    teacherTT[selectedDay] = dayTT;
    newTT[teacherId] = teacherTT;

    setTimetables(newTT);
    saveToCloud(teachers, newTT, assignments, assignmentLog);
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] font-sans text-[var(--text)] pb-20">
      {/* Header */}
      <header className="bg-white border-b border-[var(--border)] px-8 py-4 flex items-center justify-between sticky top-0 z-20 print:relative">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-[#534AB7] text-white px-3 py-1 rounded-xl font-black text-sm tracking-wider shadow-xs">
            <span className="text-amber-300 font-extrabold text-xs uppercase">Edu</span>
            <span className="text-white font-extrabold text-sm">TN43</span>
          </div>
          <h1 className="text-[19px] font-bold tracking-tight text-[var(--text)]">Teacher Substitution Finder</h1>
          <div className="flex no-print bg-[var(--bg)] p-1 rounded-lg border border-[var(--border)] gap-1 ml-2">
            <button 
              onClick={() => setIsEditMode(false)}
              className={`px-4 py-1 text-[11px] font-bold uppercase tracking-wider rounded-md transition-all ${!isEditMode ? 'bg-white shadow-sm text-[var(--accent)] border border-[var(--border)]' : 'text-[var(--text-muted)] hover:text-[var(--text)]'}`}
            >
              Substitution Finder
            </button>
            <button 
              onClick={() => setIsEditMode(true)}
              className={`px-4 py-1 text-[11px] font-bold uppercase tracking-wider rounded-md transition-all ${isEditMode ? 'bg-white shadow-sm text-[var(--accent)] border border-[var(--border)]' : 'text-[var(--text-muted)] hover:text-[var(--text)]'}`}
            >
              Edit Timetable
            </button>
          </div>
        </div>
        <div className="flex items-center gap-4 no-print">
          {/* Firebase Central Server Sync Status */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-[var(--bg)] border border-[var(--border)] shadow-xs">
            {syncStatus === 'synced' && (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                  <CloudCheck size={14} /> Firebase Central Server Active
                </span>
              </>
            )}
            {syncStatus === 'saving' && (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                <span className="text-amber-700 font-bold flex items-center gap-1.5">
                  <RefreshCw size={13} className="animate-spin" /> Syncing to Cloud...
                </span>
              </>
            )}
            {syncStatus === 'syncing' && (
              <>
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-blue-700 font-bold flex items-center gap-1.5">
                  <Cloud size={14} className="animate-bounce" /> Connecting...
                </span>
              </>
            )}
            {syncStatus === 'offline' && (
              <>
                <span className="w-2 h-2 rounded-full bg-gray-400" />
                <span className="text-gray-600 font-bold flex items-center gap-1.5">
                  <WifiOff size={14} /> Local Offline Mode
                </span>
              </>
            )}
            {syncStatus === 'error' && (
              <>
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span className="text-rose-700 font-bold flex items-center gap-1.5">
                  Sync Error
                </span>
              </>
            )}
          </div>

          <button
            onClick={triggerInstallApp}
            className={`px-3.5 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider shadow-sm active:scale-95 transition-all flex items-center gap-1.5 ${
              isAppInstalled 
                ? 'bg-[var(--purple-bg)] text-[var(--purple-text)] border border-[var(--purple-border)] hover:bg-[var(--accent-light)]' 
                : 'bg-[#534AB7] text-white hover:bg-[#3C3489]'
            }`}
            title="Install App on Windows, Chromebook, or Mac Desktop"
          >
            <Download size={14} />
            {isAppInstalled ? 'App Installed' : 'Install Desktop App'}
          </button>

          <button
            onClick={handleOpenResetModal}
            className="px-3.5 py-1.5 bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 rounded-lg text-[11px] font-bold uppercase tracking-wider shadow-sm active:scale-95 transition-all flex items-center gap-1.5"
            title="Admin Password Protected Reset Server Database"
          >
            <ShieldAlert size={14} />
            Reset Server
          </button>
          <div className="flex items-center h-9 px-1 bg-[var(--bg)] border border-[var(--border)] rounded-lg">
            {DAYS.map(day => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`h-7 px-3 text-[11px] font-semibold rounded-md transition-all ${selectedDay === day ? 'bg-white shadow-sm text-[var(--accent)]' : 'text-[var(--text-muted)] hover:text-[var(--text)]'}`}
              >
                {day.slice(0, 3)}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-0 bg-[var(--bg)] border border-[var(--border)] rounded-full text-[11px] font-mono text-[var(--text-muted)] overflow-hidden">
            <span className="px-3 py-1 border-r border-[var(--border)]">MYP 1–3</span>
            <span className="px-3 py-1 text-[var(--text-faint)]">|</span>
            <span className="px-3 py-1">MYP 4–5</span>
          </div>
        </div>
      </header>

      <main className="max-w-[1240px] mx-auto px-8 py-7">
        <AnimatePresence>
          {resetSuccessNotice && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-5 py-3.5 rounded-xl mb-6 text-xs font-semibold flex items-center justify-between no-print shadow-sm"
            >
              <div className="flex items-center gap-2.5">
                <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0" />
                <span>{resetSuccessNotice}</span>
              </div>
              <button 
                onClick={() => setResetSuccessNotice('')} 
                className="p-1 text-emerald-600 hover:text-emerald-900 rounded-lg hover:bg-emerald-100 transition-colors"
              >
                <X size={15} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        {!isEditMode && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            {/* Control Panel */}
            <section className="bg-white border border-[var(--border)] rounded-[12px] p-8 mb-6 flex flex-wrap gap-6 items-end no-print">
              <div className="flex flex-col gap-2 flex-1 min-w-[240px]">
                <label className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Absent Teacher</label>
                <select 
                  value={absentTeacher} 
                  onChange={(e) => {
                    setAbsentTeacher(e.target.value);
                    setSelectedSub('');
                  }}
                  className="w-full bg-[var(--bg)] border border-[var(--border-strong)] rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)] transition-colors cursor-pointer"
                >
                  <option value="">— select absent teacher —</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.name}>{t.name} ({t.subj})</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2 min-w-[220px]">
                <label className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Timetable Group</label>
                <select 
                  value={ttGroup} 
                  onChange={(e) => {
                    setTtGroup(e.target.value as 'myp13' | 'myp45');
                    setPeriodIdx('');
                    setSelectedSub('');
                  }}
                  className="w-full bg-[var(--bg)] border border-[var(--border-strong)] rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)] transition-colors cursor-pointer"
                >
                  <option value="myp13">MYP 1 – 3 (7 periods)</option>
                  <option value="myp45">MYP 4 – 5 (6 periods)</option>
                </select>
              </div>

              <div className="flex flex-col gap-2 min-w-[220px]">
                <label className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Period to Cover</label>
                <select 
                  value={periodIdx} 
                  onChange={(e) => {
                    setPeriodIdx(e.target.value === '' ? '' : Number(e.target.value));
                    setSelectedSub('');
                  }}
                  className="w-full bg-[var(--bg)] border border-[var(--border-strong)] rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)] transition-colors cursor-pointer"
                >
                  <option value="">— select period —</option>
                  {realPeriods.map((p, i) => (
                    <option key={p.label} value={i}>{p.label} — {p.time}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => {}}
                  className="px-8 py-2.5 bg-[#534AB7] text-white rounded-lg text-sm font-medium hover:bg-[#3C3489] active:scale-95 transition-all shadow-sm"
                >
                  Find Substitutes
                </button>
                <button 
                  onClick={handleReset}
                  className="px-6 py-2.5 bg-white border border-[var(--border-strong)] rounded-lg text-sm font-medium hover:bg-gray-50 active:scale-95 transition-all outline-none"
                >
                  Reset
                </button>
              </div>
            </section>
          </motion.div>
        )}

        {isEditMode && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-6 bg-[var(--accent-light)] border border-[var(--purple-border)] rounded-xl space-y-4 no-print"
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-[15px] font-bold text-[var(--purple-text)] mb-1">Edit Timetable Mode</h2>
                <p className="text-[12px] text-[var(--purple-strong)] opacity-80">
                  Click on teacher names/subjects to edit, toggle status pills in the grid for {selectedDay}, or add/delete teachers.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setShowAddForm(prev => !prev)}
                  className="px-4 py-2 bg-[#534AB7] text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-[#3C3489] shadow-sm active:scale-95 transition-all flex items-center gap-2"
                >
                  <UserPlus size={15} />
                  {showAddForm ? 'Cancel Add' : 'Add New Teacher'}
                </button>
                <button 
                  onClick={async () => {
                    if (window.confirm("Set all slots for all teachers to FREE across all 5 days on the central server?")) {
                      const freeTT = createAllFreeTimetables(teachers);
                      setTimetables(freeTT);
                      await saveToCloud(teachers, freeTT, assignments, assignmentLog);
                      setResetSuccessNotice('All class slots set to FREE across all staff members!');
                      setTimeout(() => setResetSuccessNotice(''), 6000);
                    }
                  }}
                  className="px-4 py-2 bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 rounded-lg text-xs font-bold uppercase tracking-widest shadow-sm active:scale-95 transition-all flex items-center gap-2"
                  title="Clear all period slots in the timetable to Free (0)"
                >
                  <RotateCcw size={14} /> Clear All to Free
                </button>
                <button 
                  onClick={handleOpenResetModal}
                  className="px-4 py-2 bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 rounded-lg text-xs font-bold uppercase tracking-widest shadow-sm active:scale-95 transition-all flex items-center gap-2"
                  title="Password-protected reset central server database"
                >
                  <ShieldAlert size={14} /> Reset Server Data
                </button>
                <button 
                  onClick={() => {
                    const config = {
                      teachers: teachers,
                      timetables: timetables
                    };
                    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'school_config.json';
                    a.click();
                    alert("Configuration exported! Please copy the contents of the downloaded 'school_config.json' and paste it to the developer chat.");
                  }}
                  className="px-4 py-2 bg-white border border-[var(--purple-border)] text-[var(--purple-text)] rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-white shadow-sm active:scale-95 transition-all flex items-center gap-2"
                >
                  Export Data
                </button>
                <button 
                  onClick={() => setIsEditMode(false)}
                  className="px-6 py-2 bg-[var(--accent)] text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-[var(--purple-strong)] shadow-sm active:scale-95 transition-all"
                >
                  Done Editing
                </button>
              </div>
            </div>

            {/* Add Teacher Inline Form */}
            <AnimatePresence>
              {showAddForm && (
                <motion.form 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  onSubmit={handleAddTeacher}
                  className="mt-4 pt-4 border-t border-[var(--purple-border)] bg-white p-5 rounded-lg border border-[var(--border)] shadow-sm space-y-4 overflow-hidden"
                >
                  <div className="text-[12px] font-bold uppercase tracking-wider text-[var(--accent)] flex items-center gap-2">
                    <UserPlus size={14} /> Add New Teacher to Staff List
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">Teacher Name *</label>
                      <input 
                        type="text"
                        required
                        value={newTeacherName}
                        onChange={e => setNewTeacherName(e.target.value)}
                        placeholder="e.g. John Smith"
                        className="w-full bg-[var(--bg)] border border-[var(--border-strong)] rounded-lg px-3 py-2 text-xs outline-none focus:border-[var(--accent)]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">Initials (Optional)</label>
                      <input 
                        type="text"
                        value={newTeacherInit}
                        onChange={e => setNewTeacherInit(e.target.value)}
                        placeholder="e.g. JS (Auto if blank)"
                        className="w-full bg-[var(--bg)] border border-[var(--border-strong)] rounded-lg px-3 py-2 text-xs outline-none focus:border-[var(--accent)]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">Subject</label>
                      <input 
                        type="text"
                        value={newTeacherSubj}
                        onChange={e => setNewTeacherSubj(e.target.value)}
                        placeholder="e.g. Physics / Mathematics"
                        className="w-full bg-[var(--bg)] border border-[var(--border-strong)] rounded-lg px-3 py-2 text-xs outline-none focus:border-[var(--accent)]"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-[var(--border)]">
                    <div className="flex items-center gap-4">
                      <span className="text-[11px] font-bold uppercase text-[var(--text-muted)]">Options:</span>
                      <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={newTeacherIsHomeBlock} 
                          onChange={e => setNewTeacherIsHomeBlock(e.target.checked)} 
                          className="accent-[var(--accent)]"
                        />
                        <span>Home Block Staff</span>
                      </label>
                      <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={newTeacherTeachesMYP13} 
                          onChange={e => setNewTeacherTeachesMYP13(e.target.checked)} 
                          className="accent-[var(--accent)]"
                        />
                        <span>Teaches MYP 1–3</span>
                      </label>
                      <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={newTeacherTeachesMYP45} 
                          onChange={e => setNewTeacherTeachesMYP45(e.target.checked)} 
                          className="accent-[var(--accent)]"
                        />
                        <span>Teaches MYP 4–5</span>
                      </label>
                    </div>

                    <div className="flex gap-2">
                      <button 
                        type="button" 
                        onClick={() => setShowAddForm(false)}
                        className="px-4 py-1.5 border border-gray-300 rounded-lg text-xs font-medium hover:bg-gray-50 active:scale-95 transition-all"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        className="px-5 py-1.5 bg-[#534AB7] text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-[#3C3489] active:scale-95 transition-all shadow-sm flex items-center gap-1.5"
                      >
                        <Plus size={14} /> Add Teacher
                      </button>
                    </div>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Floating Action Buttons */}
        {!isEditMode && (
          <div className="flex justify-end gap-3 mb-6 no-print">
            <button onClick={() => window.print()} className="px-6 py-2 bg-white border border-[var(--border-strong)] rounded-lg text-[13px] font-medium hover:bg-gray-50 transition-colors shadow-sm">
              Print / Save PDF
            </button>
            <button onClick={clearLog} className="px-6 py-2 bg-white border border-[var(--border-strong)] rounded-lg text-[13px] font-medium hover:bg-gray-50 transition-colors shadow-sm">
              Clear Log
            </button>
          </div>
        )}

        {/* Results Panel */}
        <AnimatePresence>
          {!isEditMode && absentTeacher && periodIdx !== '' && (
            <motion.section 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="bg-white border border-[var(--border)] rounded-xl p-6 mb-6 no-print shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[15px] font-semibold">
                  {availableSubs.length} teacher(s) available to substitute for {absentTeacher}
                </h3>
                <div className="flex gap-2">
                   <div className="text-xs bg-[var(--accent-light)] border border-[var(--purple-border)] px-3 py-1 rounded-full text-[var(--purple-text)] font-semibold">
                    {selectedDay}
                  </div>
                  <div className="text-xs bg-[var(--bg)] border border-[var(--border)] px-3 py-1 rounded-full text-[var(--text-muted)]">
                    {realPeriods[Number(periodIdx)].label} · {realPeriods[Number(periodIdx)].time} · {ttGroup === 'myp13' ? 'MYP 1–3' : 'MYP 4–5'}
                  </div>
                </div>
              </div>

              {availableSubs.length > 0 ? (
                <>
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-2.5 mb-6">
                    {availableSubs.map(t => (
                      <button
                        key={t.id}
                        onClick={() => setSelectedSub(t.name)}
                        className={`flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                          selectedSub === t.name 
                          ? 'border-[var(--accent)] bg-[var(--purple-bg)] shadow-sm' 
                          : 'border-[var(--green-border)] bg-[var(--green-bg)] hover:border-[#3B6D11]'
                        }`}
                      >
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 transition-colors ${
                          selectedSub === t.name ? 'bg-[#AFA9EC] text-[#3C3489]' : 'bg-[#C0DD97] text-[#27500A]'
                        }`}>
                          {t.init}
                        </div>
                        <div>
                          <p className={`text-[13px] font-medium transition-colors ${selectedSub === t.name ? 'text-[var(--purple-text)]' : 'text-[var(--green-text)]'}`}>
                            {t.name} <span className="opacity-70 text-[11px]">({t.freeCount} free in {ttGroup === 'myp13' ? 'MYP 1–3' : 'MYP 4–5'})</span>
                          </p>
                          <p className={`text-[11px] transition-colors ${selectedSub === t.name ? 'text-[var(--accent)]' : 'text-[#3B6D11]'}`}>
                            {t.subj}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-[var(--border)] flex items-center gap-3">
                    <select 
                      value={selectedSub}
                      onChange={(e) => setSelectedSub(e.target.value)}
                      className="min-w-[220px] bg-[var(--bg)] border border-[var(--border-strong)] rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)] transition-colors"
                    >
                      <option value="">Pick a substitute...</option>
                      {availableSubs.map(t => (
                        <option key={t.id} value={t.name}>{t.name} ({t.subj})</option>
                      ))}
                    </select>
                    <button 
                      onClick={handleAssign}
                      disabled={!selectedSub}
                      className="px-8 py-2.5 bg-[#534AB7] text-white rounded-lg text-sm font-medium hover:bg-[#3C3489] disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all flex items-center gap-2 shadow-sm"
                    >
                      <CheckCircle2 size={16} />
                      Assign Substitute
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-[var(--text-muted)] text-[13px] border-2 border-dashed border-[var(--border)] rounded-lg">
                  All teachers are occupied during this period. Consider splitting the class.
                </div>
              )}
            </motion.section>
          )}
        </AnimatePresence>

        {/* Assignment Log */}
        {!isEditMode && assignmentLog.length > 0 && (
          <motion.section 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white border border-[var(--border)] rounded-xl p-8 mb-6 shadow-sm"
          >
            <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-5">
              Assignments for {selectedDay}
            </div>
            <div className="space-y-0 text-[13px]">
              {assignmentLog.filter(l => l.day === selectedDay).map((log, i) => (
                <div key={i} className="flex items-center gap-4 py-3 border-b border-[var(--border)] last:border-x-0 first:pt-0 last:pb-0">
                  <span className="font-mono text-[11px] bg-[var(--bg)] px-3 py-1 rounded border border-[var(--border)] min-w-[100px] text-center">
                    {log.periodLabel} · {log.periodTime}
                  </span>
                  <span className="text-[12px] text-[var(--text-muted)] whitespace-nowrap">{log.group}</span>
                  <div className="h-4 w-[1px] bg-[var(--border)] mx-1" />
                  <span className="font-medium whitespace-nowrap">Absent: {log.absent}</span>
                  <ArrowRight size={16} className="text-[var(--text-faint)]" />
                  <span className="inline-flex items-center gap-1.5 bg-[var(--purple-bg)] text-[var(--purple-text)] border border-[var(--purple-border)] rounded-full px-4 py-1 text-[12px] font-medium transition-all hover:border-[var(--purple-strong)]">
                    Sub: {log.sub}
                  </span>
                </div>
              ))}
              {assignmentLog.filter(l => l.day === selectedDay).length === 0 && (
                <div className="py-2 text-[var(--text-faint)] italic">No assignments for {selectedDay} yet.</div>
              )}
            </div>
          </motion.section>
        )}

        {/* Legend */}
        {!isEditMode && (
          <div className="flex flex-wrap gap-5 mb-5 no-print">
            <LegendItem color="bg-[#FAECE7]" borderColor="border-[#F0997B]" label="Occupied" />
            <LegendItem color="bg-[#EAF3DE]" borderColor="border-[#97C459]" label="Free" />
            <LegendItem color="bg-[#EEEDFE]" borderColor="border-[#534AB7]" label="Available to Substitute" highlighted />
            <LegendItem color="bg-[#FAEEDA]" borderColor="border-[#EF9F27]" label="Break" />
            <LegendItem color="bg-[#AFA9EC]" borderColor="border-[#534AB7]" label="Assigned" />
          </div>
        )}

        {/* Timetable Tabs */}
        {!isEditMode && (
          <div className="flex border-b border-[var(--border)] mb-6 no-print">
            <button 
              onClick={() => setActiveTab('myp13')}
              className={`px-5 py-3 text-[13px] font-medium transition-all relative ${
                activeTab === 'myp13' ? 'text-[var(--accent)]' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              MYP 1 – 3 Timetable
              {activeTab === 'myp13' && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-[3px] bg-[var(--accent)]" />}
            </button>
            <button 
              onClick={() => setActiveTab('myp45')}
              className={`px-5 py-3 text-[13px] font-medium transition-all relative ${
                activeTab === 'myp45' ? 'text-[var(--accent)]' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              MYP 4 – 5 Timetable
              {activeTab === 'myp45' && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-[3px] bg-[var(--accent)]" />}
            </button>
          </div>
        )}

        {/* Timetable Content */}
        <div className="bg-white border border-[var(--border)] rounded-xl p-8 overflow-hidden shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              {activeTab === 'myp13' ? 'MYP 1–3 — 7 Periods' : 'MYP 4–5 — 6 Periods'} — {selectedDay}
            </div>
            {isEditMode && <div className="text-[10px] font-bold bg-[#EF9F27] text-white px-2 py-0.5 rounded uppercase">Editing Timetable</div>}
          </div>
          <div className="overflow-x-auto">
            <TimetableGrid 
              activeTab={activeTab} 
              periods={activeTab === 'myp13' ? PERIODS_13 : PERIODS_45}
              teachers={teachers}
              timetables={timetables}
              selectedDay={selectedDay}
              assignments={assignments}
              highlightTeachers={isEditMode ? [] : availableSubs.map(t => t.name)}
              highlightPeriodIdx={isEditMode ? -1 : (periodIdx === '' ? -1 : Number(periodIdx))}
              highlightGroup={isEditMode ? null : ttGroup}
              isEditMode={isEditMode}
              onUpdateTeacher={handleUpdateTeacher}
              onDeleteTeacher={handleDeleteTeacher}
              onToggleSlot={handleToggleSlot}
            />
          </div>
        </div>
      </main>

      {/* Install App Guide Modal */}
      <AnimatePresence>
        {showInstallGuide && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4"
            onClick={() => setShowInstallGuide(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[var(--border)] space-y-5"
            >
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[var(--purple-bg)] border border-[var(--purple-border)] flex items-center justify-center text-[var(--accent)] font-bold">
                    <Laptop size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[var(--text)]">Install Desktop App</h3>
                    <p className="text-xs text-[var(--text-muted)]">Works on Windows, Chromebooks, macOS & Mobile</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowInstallGuide(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3 text-xs leading-relaxed text-[var(--text-muted)]">
                <p className="font-medium text-[var(--text)] text-sm">
                  Install this app directly to your desktop or launcher for instant access and offline use:
                </p>

                <div className="bg-[var(--bg)] p-3.5 rounded-xl border border-[var(--border)] space-y-1.5">
                  <div className="font-bold text-[var(--accent)] flex items-center gap-2 text-[12px]">
                    <Monitor size={15} /> Windows & Chromebooks (Chrome / Edge)
                  </div>
                  <ol className="list-decimal list-inside space-y-1 pl-1 text-[11px]">
                    <li>Look at your browser address bar (URL bar) at the top right.</li>
                    <li>Click the <strong>Install icon (⊕ or 💻)</strong> next to the bookmark star.</li>
                    <li>Or click menu <strong>(⋮) → Save and Share → Install page as app</strong>.</li>
                  </ol>
                </div>

                <div className="bg-[var(--bg)] p-3.5 rounded-xl border border-[var(--border)] space-y-1.5">
                  <div className="font-bold text-[var(--accent)] flex items-center gap-2 text-[12px]">
                    <Laptop size={15} /> Mac Desktop (macOS Safari or Chrome)
                  </div>
                  <ol className="list-decimal list-inside space-y-1 pl-1 text-[11px]">
                    <li><strong>Safari:</strong> Click <strong>File</strong> in Mac menu bar → <strong>Add to Dock</strong>.</li>
                    <li><strong>Chrome:</strong> Click menu <strong>(⋮) → Save and Share → Install page as app</strong>.</li>
                  </ol>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setShowInstallGuide(false)}
                  className="px-6 py-2 bg-[#534AB7] text-white rounded-lg text-xs font-semibold hover:bg-[#3C3489] transition-all shadow-sm"
                >
                  Got It
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reset Server Database Modal */}
      <AnimatePresence>
        {showResetModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4"
            onClick={() => setShowResetModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[var(--border)] space-y-5"
            >
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600 font-bold">
                    <ShieldAlert size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[var(--text)]">Reset Central Server Data</h3>
                    <p className="text-xs text-[var(--text-muted)]">Admin Password Required</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowResetModal(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={executeServerReset} className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-800 space-y-1">
                  <p className="font-bold flex items-center gap-1.5 text-amber-900">
                    <AlertTriangle size={15} /> Danger Zone
                  </p>
                  <p>
                    This action will reset the central Firebase server database and clear all substitution records across all staff devices.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-[var(--text)] uppercase tracking-wider">
                    Reset Mode Selection
                  </label>
                  <div className="space-y-2 text-xs">
                    <div 
                      onClick={() => setResetMode('all_free')}
                      className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                        resetMode === 'all_free' 
                          ? 'border-[#534AB7] bg-indigo-50/70 text-indigo-950 font-medium shadow-xs' 
                          : 'border-[var(--border)] hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="resetMode"
                        value="all_free"
                        checked={resetMode === 'all_free'}
                        onChange={() => setResetMode('all_free')}
                        className="mt-0.5 accent-[#534AB7]"
                      />
                      <div>
                        <div className="font-bold text-sm text-[var(--text)] flex items-center gap-1.5">
                          <CheckCircle2 size={15} className="text-emerald-600" />
                          Set ALL Timetable Slots to FREE (0)
                        </div>
                        <p className="text-[11px] text-[var(--text-muted)] font-normal mt-0.5">
                          Clears every period across all 5 days for every teacher to FREE (0). Everything on the timetable will show FREE.
                        </p>
                      </div>
                    </div>

                    <div 
                      onClick={() => setResetMode('demo')}
                      className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                        resetMode === 'demo' 
                          ? 'border-[#534AB7] bg-indigo-50/70 text-indigo-950 font-medium shadow-xs' 
                          : 'border-[var(--border)] hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="resetMode"
                        value="demo"
                        checked={resetMode === 'demo'}
                        onChange={() => setResetMode('demo')}
                        className="mt-0.5 accent-[#534AB7]"
                      />
                      <div>
                        <div className="font-bold text-sm text-[var(--text)]">
                          Restore Preloaded Demo Schedule
                        </div>
                        <p className="text-[11px] text-[var(--text-muted)] font-normal mt-0.5">
                          Restores sample timetable schedule with pre-filled occupied/free classes.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[var(--text)] uppercase tracking-wider">
                    Enter Admin Password
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={resetPasswordInput}
                      onChange={(e) => {
                        setResetPasswordInput(e.target.value);
                        setResetPasswordError('');
                      }}
                      placeholder="Enter admin password"
                      className="w-full bg-[var(--bg)] border border-[var(--border-strong)] rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-[var(--accent)] transition-all pr-10"
                      autoFocus
                    />
                    <Lock size={16} className="absolute right-3 top-3 text-gray-400" />
                  </div>
                  {resetPasswordError && (
                    <p className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 p-2.5 rounded-lg flex items-center gap-2">
                      <X size={14} /> {resetPasswordError}
                    </p>
                  )}
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowResetModal(false)}
                    className="px-4 py-2 border border-[var(--border)] rounded-lg text-xs font-semibold hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700 active:scale-95 transition-all shadow-sm flex items-center gap-1.5"
                  >
                    <RotateCcw size={14} />
                    Confirm Reset
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>

  );
}

function LegendItem({ color, borderColor, label, highlighted = false }: { color: string; borderColor: string; label: string; highlighted?: boolean }) {
  return (
    <div className="flex items-center gap-2.5 text-[12px] text-[var(--text-muted)] font-normal">
      <div className={`legend-square ${color} ${borderColor} ${highlighted ? 'border-[1.5px]' : ''}`} />
      {label}
    </div>
  );
}

interface TimetableGridProps {
  activeTab: 'myp13' | 'myp45';
  periods: typeof PERIODS_13;
  teachers: Array<{ 
    id: string; 
    name: string; 
    subj: string; 
    isHomeBlock: boolean;
    teachesMYP13: boolean;
    teachesMYP45: boolean;
  }>;
  timetables: Record<string, Record<Day, { myp13: number[], myp45: number[] }>>;
  selectedDay: Day;
  assignments: Record<string, Record<string, boolean>>;
  highlightTeachers: string[];
  highlightPeriodIdx: number;
  highlightGroup: string | null;
  isEditMode: boolean;
  onUpdateTeacher: (
    id: string, 
    name: string, 
    subj: string, 
    isHomeBlock?: boolean, 
    teachesMYP13?: boolean, 
    teachesMYP45?: boolean
  ) => void;
  onDeleteTeacher: (id: string) => void;
  onToggleSlot: (teacherId: string, group: 'myp13' | 'myp45', idx: number) => void;
}

function TimetableGrid({ 
  activeTab, 
  periods, 
  teachers, 
  timetables, 
  selectedDay, 
  assignments, 
  highlightTeachers, 
  highlightPeriodIdx, 
  highlightGroup,
  isEditMode,
  onUpdateTeacher,
  onDeleteTeacher,
  onToggleSlot
}: TimetableGridProps) {
  // Filter teachers by section membership for the current tab
  const filteredTeachers = useMemo(() => {
    return teachers.filter(t => activeTab === 'myp13' ? t.teachesMYP13 : t.teachesMYP45);
  }, [teachers, activeTab]);

  return (
    <table className="w-full border-collapse text-[11px] min-w-[1000px]">
      <thead>
        <tr>
          <th className="bg-[#fcfbf9] p-3 text-left font-semibold text-[var(--text-muted)] border border-[var(--border)] w-40">Teacher</th>
          <th className="bg-[#fcfbf9] p-3 text-left font-semibold text-[var(--text-muted)] border border-[var(--border)] w-28">Subject</th>
          {periods.map((p, i) => (
            <th 
              key={i} 
              className={`p-3 text-center border border-[var(--border)] ${p.isBreak ? 'bg-[#fdf9f2]' : 'bg-[#fcfbf9]'}`}
            >
              <div className="font-semibold text-[var(--text)]">{p.label}</div>
              <div className="font-normal text-[9px] text-[var(--text-faint)] leading-tight">{p.time}</div>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {filteredTeachers.map(teacher => {
          const teacherTT = timetables[teacher.id];
          const dayTT = teacherTT?.[selectedDay];
          const teacherSlots = dayTT ? (activeTab === 'myp13' ? dayTT.myp13 : dayTT.myp45) : [];
          let realPeriodIdx = 0;
          return (
            <tr key={teacher.id} className="hover:bg-[#fafaf8]">
              <td className="p-2 border border-[var(--border)] whitespace-nowrap">
                {isEditMode ? (
                  <div className="flex flex-col gap-1.5 p-1">
                    <div className="flex items-center justify-between gap-1">
                      <input 
                        value={teacher.name}
                        onChange={(e) => onUpdateTeacher(teacher.id, e.target.value, teacher.subj)}
                        className="w-full bg-transparent border-none outline-none font-medium text-[var(--text)] p-0 hover:bg-white rounded transition-all focus:bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => onDeleteTeacher(teacher.id)}
                        title={`Delete ${teacher.name}`}
                        className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors flex-shrink-0"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={teacher.isHomeBlock} 
                          onChange={(e) => onUpdateTeacher(teacher.id, teacher.name, teacher.subj, e.target.checked)}
                          className="w-3 h-3 accent-[var(--accent)] scale-90"
                        />
                        <span className="text-[8px] font-bold uppercase tracking-wider text-[var(--text-muted)]">HB</span>
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={teacher.teachesMYP13} 
                          onChange={(e) => onUpdateTeacher(teacher.id, teacher.name, teacher.subj, teacher.isHomeBlock, e.target.checked)}
                          className="w-3 h-3 accent-[var(--accent)] scale-90"
                        />
                        <span className="text-[8px] font-bold uppercase tracking-wider text-[var(--text-muted)]">1–3</span>
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={teacher.teachesMYP45} 
                          onChange={(e) => onUpdateTeacher(teacher.id, teacher.name, teacher.subj, teacher.isHomeBlock, teacher.teachesMYP13, e.target.checked)}
                          className="w-3 h-3 accent-[var(--accent)] scale-90"
                        />
                        <span className="text-[8px] font-bold uppercase tracking-wider text-[var(--text-muted)]">4–5</span>
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="p-1 flex items-center gap-2">
                    <span className="font-medium text-[var(--text)]">{teacher.name}</span>
                    {!teacher.isHomeBlock && (
                      <span className="text-[8px] font-bold uppercase py-0.5 px-1.5 bg-gray-100 text-gray-400 border border-gray-200 rounded tracking-tighter">External</span>
                    )}
                  </div>
                )}
              </td>
              <td className="p-2 border border-[var(--border)]">
                {isEditMode ? (
                  <input 
                    value={teacher.subj}
                    onChange={(e) => onUpdateTeacher(teacher.id, teacher.name, e.target.value)}
                    className="w-full bg-transparent border-none outline-none text-[var(--text-muted)] text-[11px] font-normal p-1 hover:bg-white rounded transition-all focus:bg-white focus:shadow-sm"
                  />
                ) : (
                  <span className="p-1 block text-[var(--text-muted)] text-[11px] font-normal">{teacher.subj}</span>
                )}
              </td>
              {periods.map((p, i) => {
                if (p.isBreak) {
                  return <td key={i} className="p-1.5 border border-[var(--border)]">
                    <span className="status-pill status-break">Break</span>
                  </td>;
                }

                const currentRealIdx = realPeriodIdx++;
                const key = `${selectedDay}_${activeTab}_${p.label}`;
                const isAssigned = assignments[teacher.id]?.[key];
                const isHighlighted = highlightTeachers.includes(teacher.name) && activeTab === highlightGroup && currentRealIdx === highlightPeriodIdx;
                const isBusy = teacherSlots[currentRealIdx] === 1;

                const handleClick = () => {
                  if (isEditMode) {
                    onToggleSlot(teacher.id, activeTab, currentRealIdx);
                  }
                };

                if (isAssigned) {
                  return <td key={i} className="p-1.5 border border-[var(--border)]">
                    <span className="status-pill status-assigned">Assigned</span>
                  </td>;
                }
                if (isHighlighted) {
                  return <td key={i} className="p-1.5 border border-[var(--border)]">
                    <span className="status-pill status-highlighted">Free ★</span>
                  </td>;
                }
                if (isBusy) {
                  return <td key={i} className="p-1.5 border border-[var(--border)]">
                    <span 
                      onClick={handleClick}
                      className={`status-pill status-occupied ${isEditMode ? 'cursor-pointer hover:opacity-80 active:scale-95 transition-all' : ''}`}
                    >
                      Occupied
                    </span>
                  </td>;
                }
                return <td key={i} className="p-1.5 border border-[var(--border)]">
                  <span 
                    onClick={handleClick}
                    className={`status-pill status-free ${isEditMode ? 'cursor-pointer hover:opacity-80 active:scale-95 transition-all' : ''}`}
                  >
                    Free
                  </span>
                </td>;
              })}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
