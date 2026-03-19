import { useState, useEffect, useMemo, useRef } from 'react'

const BIN_ID = '67bc7f79b7ec241ddc846402'
const API_KEY = '$2a$10$YpEq/qD5qOdKkKye1lbRdejCX9I0674Lu7EtbYSRQITnh/D14oUB.'
const BASE = 'https://api.jsonbin.io/v3/b'

async function sget(key) {
  try {
    const r = await fetch(BASE + '/' + BIN_ID + '/latest', {
      headers: { 'X-Master-Key': API_KEY }
    })
    const d = await r.json()
    return d.record[key] !== undefined ? d.record[key] : null
  } catch { return null }
}
async function sset(key, val) {
  try {
    const r = await fetch(BASE + '/' + BIN_ID + '/latest', {
      headers: { 'X-Master-Key': API_KEY }
    })
    const d = await r.json()
    const updated = Object.assign({}, d.record, { [key]: val })
    await fetch(BASE + '/' + BIN_ID, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-Master-Key': API_KEY },
      body: JSON.stringify(updated)
    })
  } catch {}
}
async function sdel(key) {
  try {
    const r = await fetch(BASE + '/' + BIN_ID + '/latest', {
      headers: { 'X-Master-Key': API_KEY }
    })
    const d = await r.json()
    const updated = Object.assign({}, d.record)
    delete updated[key]
    await fetch(BASE + '/' + BIN_ID, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-Master-Key': API_KEY },
      body: JSON.stringify(updated)
    })
  } catch {}
}
function slisten(key, cb) {
  const interval = setInterval(async function() {
    const val = await sget(key)
    cb(val)
  }, 2000)
  return function() { clearInterval(interval) }
}

const pts = ({ R=0, HR=0, RBI=0, SB=0, AVG=0 } = {}) =>
  parseFloat(((R + RBI + HR + 0.5 * SB) * AVG).toFixed(3));

const TEAMS = 6;
const ROUNDS = 24;
const TOTAL_PICKS = TEAMS * ROUNDS;
const POSITIONS = ["C","1B","2B","3B","SS","OF"];
const SLOT_DEFS = [{pos:"C",count:3},{pos:"1B",count:3},{pos:"2B",count:3},{pos:"3B",count:3},{pos:"SS",count:3},{pos:"OF",count:9}];
const SLOT_LIMITS = {C:3,"1B":3,"2B":3,"3B":3,SS:3,OF:9};

const KEYS = {
  mode:  "fb26:mode",
  setup: "fb26:setup",
  pool:  "fb26:pool",
  draft: "fb26:draft",
  claim: "fb26:myclaim",
};



function snakeOrder(numTeams, numRounds) {
  const picks = [];
  for (let r = 0; r < numRounds; r++) {
    const row = r % 2 === 0
      ? Array.from({length: numTeams}, (_, i) => i)
      : Array.from({length: numTeams}, (_, i) => numTeams - 1 - i);
    row.forEach(t => picks.push({ round: r + 1, teamIdx: t, pickNum: picks.length + 1 }));
  }
  return picks;
}

function playerScore(player, statMode) {
  if (statMode === "2025") return player.stats2025 ? pts(player.stats2025) : 0;
  return pts(player.proj);
}

const CATCHER_POOL = [
  {id:"c001",name:"Cal Raleigh",        team:"SEA",pos:"C",mlbId:"663728",proj:{R:82,HR:41,RBI:108,SB:7, AVG:.230},stats2025:{R:110,HR:60,RBI:125,SB:14,AVG:0.247}},
  {id:"c002",name:"William Contreras",  team:"MIL",pos:"C",mlbId:"661388",proj:{R:87,HR:20,RBI:82, SB:6, AVG:.270},stats2025:{R:89,HR:17,RBI:76,SB:6,AVG:0.26}},
  {id:"c003",name:"Adley Rutschman",    team:"BAL",pos:"C",mlbId:"668939",proj:{R:65,HR:19,RBI:66, SB:1, AVG:.254},stats2025:{R:37,HR:9,RBI:29,SB:0,AVG:0.22}},
  {id:"c004",name:"Alejandro Kirk",     team:"TOR",pos:"C",mlbId:"672386",proj:{R:43,HR:14,RBI:62, SB:1, AVG:.270},stats2025:{R:45,HR:15,RBI:76,SB:1,AVG:0.282}},
  {id:"c005",name:"Drake Baldwin",      team:"ATL",pos:"C",mlbId:"686948",proj:{R:56,HR:21,RBI:71, SB:0, AVG:.265},stats2025:{R:56,HR:19,RBI:80,SB:0,AVG:0.274}},
  {id:"c006",name:"Will Smith",         team:"LAD",pos:"C",mlbId:"669257",proj:{R:67,HR:19,RBI:66, SB:2, AVG:.257},stats2025:{R:64,HR:17,RBI:61,SB:2,AVG:0.296}},
  {id:"c007",name:"Shea Langeliers",    team:"ATH",pos:"C",mlbId:"669127",proj:{R:70,HR:29,RBI:93, SB:5, AVG:.257},stats2025:{R:73,HR:31,RBI:72,SB:7,AVG:0.277}},
  {id:"c008",name:"Patrick Bailey",     team:"SFG",pos:"C",mlbId:"672275",proj:{R:45,HR:9, RBI:46, SB:2, AVG:.230},stats2025:{R:47,HR:6,RBI:55,SB:1,AVG:0.222}},
  {id:"c009",name:"Gabriel Moreno",     team:"ARI",pos:"C",mlbId:"672515",proj:{R:44,HR:9, RBI:45, SB:3, AVG:.278},stats2025:{R:44,HR:9,RBI:40,SB:2,AVG:0.285}},
  {id:"c010",name:"Carter Jensen",      team:"KCR",pos:"C",mlbId:"695600",proj:{R:68,HR:17,RBI:69, SB:7, AVG:.242},stats2025:{R:12,HR:3,RBI:13,SB:0,AVG:0.3}},
  {id:"c011",name:"Yainer Diaz",        team:"HOU",pos:"C",mlbId:"673237",proj:{R:64,HR:20,RBI:75, SB:1, AVG:.272},stats2025:{R:56,HR:20,RBI:70,SB:1,AVG:0.256}},
  {id:"c012",name:"Dillon Dingler",     team:"DET",pos:"C",mlbId:"693307",proj:{R:48,HR:13,RBI:61, SB:1, AVG:.244},stats2025:{R:54,HR:13,RBI:57,SB:0,AVG:0.278}},
  {id:"c013",name:"Sean Murphy",        team:"ATL",pos:"C",mlbId:"669221",proj:{R:41,HR:17,RBI:47, SB:0, AVG:.224},stats2025:{R:34,HR:16,RBI:45,SB:0,AVG:0.199}},
  {id:"c014",name:"Francisco Alvarez",  team:"NYM",pos:"C",mlbId:"682626",proj:{R:53,HR:21,RBI:64, SB:1, AVG:.235},stats2025:{R:32,HR:11,RBI:32,SB:0,AVG:0.256}},
  {id:"c015",name:"J.T. Realmuto",      team:"PHI",pos:"C",mlbId:"592663",proj:{R:57,HR:15,RBI:57, SB:8, AVG:.257},stats2025:{R:57,HR:12,RBI:52,SB:8,AVG:0.257}},
  {id:"c016",name:"Hunter Goodman",     team:"COL",pos:"C",mlbId:"696100",proj:{R:68,HR:26,RBI:83, SB:1, AVG:.263},stats2025:{R:73,HR:31,RBI:91,SB:1,AVG:0.278}},
  {id:"c017",name:"Kyle Teel",          team:"CHW",pos:"C",mlbId:"691019",proj:{R:64,HR:12,RBI:55, SB:7, AVG:.247},stats2025:{R:38,HR:8,RBI:35,SB:3,AVG:0.273}},
  {id:"c018",name:"Samuel Basallo",     team:"BAL",pos:"C",mlbId:"694212",proj:{R:59,HR:25,RBI:74, SB:1, AVG:.238},stats2025:{R:10,HR:4,RBI:15,SB:0,AVG:0.165}},
  {id:"c019",name:"Dalton Rushing",     team:"LAD",pos:"C",mlbId:"687221",proj:{R:49,HR:16,RBI:56, SB:1, AVG:.232},stats2025:{R:15,HR:4,RBI:24,SB:0,AVG:0.204}},
  {id:"c020",name:"Austin Wells",       team:"NYY",pos:"C",mlbId:"669224",proj:{R:48,HR:18,RBI:64, SB:5, AVG:.225},stats2025:{R:51,HR:21,RBI:71,SB:5,AVG:0.219}},
  {id:"c021",name:"Willson Contreras",  team:"BOS",pos:"C",mlbId:"575929",proj:{R:57,HR:17,RBI:64, SB:4, AVG:.254},stats2025:{R:70,HR:20,RBI:80,SB:5,AVG:0.257}},
  {id:"c022",name:"Harry Ford",         team:"WSN",pos:"C",mlbId:"695670",proj:{R:62,HR:10,RBI:55, SB:9, AVG:.234},stats2025:{R:1,HR:0,RBI:1,SB:0,AVG:0.167}},
  {id:"c023",name:"Ivan Herrera",       team:"STL",pos:"C",mlbId:"671056",proj:{R:58,HR:14,RBI:60, SB:8, AVG:.274},stats2025:{R:54,HR:19,RBI:66,SB:8,AVG:0.284}},
  {id:"c024",name:"Bo Naylor",          team:"CLE",pos:"C",mlbId:"666310",proj:{R:53,HR:16,RBI:52, SB:3, AVG:.216},stats2025:{R:46,HR:14,RBI:47,SB:1,AVG:0.195}},
  {id:"c025",name:"Agustin Ramirez",    team:"MIA",pos:"C",mlbId:"682663",proj:{R:82,HR:22,RBI:79, SB:16,AVG:.237},stats2025:{R:72,HR:21,RBI:67,SB:16,AVG:0.231}},
  {id:"c026",name:"Ryan Jeffers",       team:"MIN",pos:"C",mlbId:"680777",proj:{R:47,HR:12,RBI:47, SB:2, AVG:.245},stats2025:{R:47,HR:9,RBI:47,SB:1,AVG:0.266}},
  {id:"c027",name:"Luis Campusano",     team:"SDP",pos:"C",mlbId:"669134",proj:{R:55,HR:13,RBI:54, SB:1, AVG:.247}},
  {id:"c028",name:"Salvador Perez",     team:"KCR",pos:"C",mlbId:"521692",proj:{R:52,HR:24,RBI:80, SB:0, AVG:.246},stats2025:{R:54,HR:30,RBI:100,SB:0,AVG:0.236}},
  {id:"c029",name:"Ben Rice",           team:"NYY",pos:"C",mlbId:"700250",proj:{R:70,HR:24,RBI:73, SB:4, AVG:.241},stats2025:{R:74,HR:26,RBI:65,SB:3,AVG:0.255}},
  {id:"c030",name:"Logan O'Hoppe",      team:"LAA",pos:"C",mlbId:"681351",proj:{R:45,HR:19,RBI:53, SB:2, AVG:.235},stats2025:{R:35,HR:19,RBI:43,SB:2,AVG:0.213}},
  {id:"c031",name:"Tyler Stephenson",   team:"CIN",pos:"C",mlbId:"663886",proj:{R:50,HR:14,RBI:55, SB:0, AVG:.234},stats2025:{R:40,HR:13,RBI:50,SB:0,AVG:0.231}},
  {id:"c032",name:"Jesus Rodriguez",    team:"SFG",pos:"C",mlbId:"683679",proj:{R:59,HR:6, RBI:50, SB:12,AVG:.276}},
  {id:"c033",name:"Freddy Fermin",      team:"SDP",pos:"C",mlbId:"666023",proj:{R:31,HR:7, RBI:32, SB:1, AVG:.234},stats2025:{R:32,HR:5,RBI:26,SB:1,AVG:0.251}},
  {id:"c034",name:"Victor Caratini",    team:"MIN",pos:"C",mlbId:"605170",proj:{R:29,HR:7, RBI:34, SB:1, AVG:.248},stats2025:{R:35,HR:12,RBI:46,SB:1,AVG:0.259}},
  {id:"c035",name:"Joe Mack",           team:"MIA",pos:"C",mlbId:"691788",proj:{R:57,HR:15,RBI:62, SB:4, AVG:.221}},
  {id:"c036",name:"Danny Jansen",       team:"TEX",pos:"C",mlbId:"643376",proj:{R:36,HR:13,RBI:39, SB:0, AVG:.205},stats2025:{R:38,HR:14,RBI:36,SB:0,AVG:0.215}},
  {id:"c037",name:"Keibert Ruiz",       team:"WSN",pos:"C",mlbId:"660688",proj:{R:35,HR:9, RBI:45, SB:2, AVG:.244},stats2025:{R:19,HR:2,RBI:25,SB:0,AVG:0.247}},
  {id:"c038",name:"Joey Bart",          team:"PIT",pos:"C",mlbId:"663698",proj:{R:34,HR:8, RBI:33, SB:1, AVG:.238},stats2025:{R:21,HR:4,RBI:30,SB:1,AVG:0.249}},
].sort((a,b) => pts(b.proj) - pts(a.proj));

const FIRSTBASE_POOL = [
  {id:"1b001",name:"Vladimir Guerrero Jr.",team:"TOR",pos:"1B",mlbId:"665489",proj:{R:93,HR:32,RBI:102,SB:5, AVG:.291},stats2025:{R:96,HR:23,RBI:84,SB:6,AVG:0.292}},
  {id:"1b002",name:"Pete Alonso",          team:"BAL",pos:"1B",mlbId:"624413",proj:{R:84,HR:38,RBI:113,SB:1, AVG:.274},stats2025:{R:87,HR:38,RBI:126,SB:1,AVG:0.272}},
  {id:"1b003",name:"Freddie Freeman",      team:"LAD",pos:"1B",mlbId:"518692",proj:{R:82,HR:22,RBI:82, SB:8, AVG:.288},stats2025:{R:81,HR:24,RBI:90,SB:6,AVG:0.295}},
  {id:"1b004",name:"Cody Bellinger",       team:"NYY",pos:"1B",mlbId:"641355",proj:{R:84,HR:22,RBI:90, SB:12,AVG:.264},stats2025:{R:89,HR:29,RBI:98,SB:13,AVG:0.272}},
  {id:"1b005",name:"Michael Busch",        team:"CHC",pos:"1B",mlbId:"683737",proj:{R:82,HR:28,RBI:87, SB:3, AVG:.257},stats2025:{R:78,HR:34,RBI:90,SB:4,AVG:0.261}},
  {id:"1b006",name:"Matt Olson",           team:"ATL",pos:"1B",mlbId:"621566",proj:{R:86,HR:30,RBI:91, SB:1, AVG:.250},stats2025:{R:98,HR:29,RBI:95,SB:1,AVG:0.272}},
  {id:"1b007",name:"Bryce Harper",         team:"PHI",pos:"1B",mlbId:"547180",proj:{R:73,HR:24,RBI:78, SB:10,AVG:.274},stats2025:{R:72,HR:27,RBI:75,SB:12,AVG:0.261}},
  {id:"1b008",name:"Nick Kurtz",           team:"ATH",pos:"1B",mlbId:"701762",proj:{R:91,HR:31,RBI:103,SB:2, AVG:.264},stats2025:{R:90,HR:36,RBI:86,SB:2,AVG:0.29}},
  {id:"1b009",name:"Josh Naylor",          team:"SEA",pos:"1B",mlbId:"647304",proj:{R:67,HR:21,RBI:91, SB:18,AVG:.272},stats2025:{R:81,HR:20,RBI:92,SB:30,AVG:0.295}},
  {id:"1b010",name:"Sal Stewart",          team:"CIN",pos:"1B",mlbId:"701398",proj:{R:72,HR:19,RBI:76, SB:10,AVG:.257},stats2025:{R:11,HR:5,RBI:8,SB:0,AVG:0.255}},
  {id:"1b011",name:"Jonathan Aranda",      team:"TBR",pos:"1B",mlbId:"666018",proj:{R:60,HR:16,RBI:62, SB:1, AVG:.274},stats2025:{R:56,HR:14,RBI:59,SB:0,AVG:0.316}},
  {id:"1b012",name:"Spencer Torkelson",    team:"DET",pos:"1B",mlbId:"679529",proj:{R:85,HR:31,RBI:96, SB:2, AVG:.242},stats2025:{R:82,HR:31,RBI:78,SB:2,AVG:0.24}},
  {id:"1b013",name:"Max Muncy",            team:"LAD",pos:"1B",mlbId:"571970",proj:{R:56,HR:20,RBI:60, SB:2, AVG:.218},stats2025:{R:48,HR:19,RBI:67,SB:4,AVG:0.243}},
  {id:"1b014",name:"Yandy Diaz",           team:"TBR",pos:"1B",mlbId:"650490",proj:{R:70,HR:17,RBI:74, SB:2, AVG:.296},stats2025:{R:79,HR:25,RBI:83,SB:3,AVG:0.3}},
  {id:"1b015",name:"Spencer Horwitz",      team:"PIT",pos:"1B",mlbId:"687462",proj:{R:64,HR:11,RBI:57, SB:2, AVG:.274},stats2025:{R:55,HR:11,RBI:51,SB:0,AVG:0.272}},
  {id:"1b016",name:"Luis Arraez",          team:"SFG",pos:"1B",mlbId:"650333",proj:{R:72,HR:6, RBI:64, SB:8, AVG:.311},stats2025:{R:66,HR:8,RBI:61,SB:11,AVG:0.292}},
  {id:"1b017",name:"Jake Cronenworth",     team:"SDP",pos:"1B",mlbId:"630105",proj:{R:63,HR:12,RBI:55, SB:3, AVG:.233},stats2025:{R:61,HR:11,RBI:59,SB:3,AVG:0.246}},
  {id:"1b018",name:"Munetaka Murakami",    team:"CHW",pos:"1B",mlbId:"808959",proj:{R:65,HR:24,RBI:69, SB:8, AVG:.234}},
  {id:"1b019",name:"Christian Walker",     team:"HOU",pos:"1B",mlbId:"572233",proj:{R:66,HR:25,RBI:76, SB:3, AVG:.233},stats2025:{R:72,HR:27,RBI:88,SB:2,AVG:0.238}},
  {id:"1b020",name:"Coby Mayo",            team:"BAL",pos:"1B",mlbId:"691723",proj:{R:64,HR:22,RBI:70, SB:4, AVG:.234},stats2025:{R:30,HR:11,RBI:28,SB:3,AVG:0.217}},
  {id:"1b021",name:"Spencer Steer",        team:"CIN",pos:"1B",mlbId:"668715",proj:{R:67,HR:19,RBI:76, SB:10,AVG:.236},stats2025:{R:66,HR:21,RBI:75,SB:7,AVG:0.238}},
  {id:"1b022",name:"Vinnie Pasquantino",   team:"KCR",pos:"1B",mlbId:"686469",proj:{R:63,HR:26,RBI:90, SB:1, AVG:.253},stats2025:{R:72,HR:32,RBI:113,SB:1,AVG:0.264}},
  {id:"1b023",name:"Alec Burleson",        team:"STL",pos:"1B",mlbId:"676475",proj:{R:58,HR:18,RBI:68, SB:5, AVG:.274},stats2025:{R:54,HR:18,RBI:69,SB:5,AVG:0.29}},
  {id:"1b024",name:"Paul Goldschmidt",     team:"NYY",pos:"1B",mlbId:"502671",proj:{R:66,HR:16,RBI:63, SB:5, AVG:.256},stats2025:{R:76,HR:10,RBI:45,SB:5,AVG:0.274}},
  {id:"1b025",name:"Nathaniel Lowe",       team:"CIN",pos:"1B",mlbId:"663993",proj:{R:62,HR:16,RBI:74, SB:1, AVG:.265},stats2025:{R:64,HR:18,RBI:84,SB:1,AVG:0.228}},
  {id:"1b026",name:"Kyle Manzardo",        team:"CLE",pos:"1B",mlbId:"700932",proj:{R:57,HR:22,RBI:69, SB:2, AVG:.243},stats2025:{R:47,HR:27,RBI:70,SB:2,AVG:0.234}},
  {id:"1b027",name:"Tyler Soderstrom",     team:"ATH",pos:"1B",mlbId:"691016",proj:{R:62,HR:23,RBI:86, SB:4, AVG:.252},stats2025:{R:75,HR:25,RBI:93,SB:8,AVG:0.276}},
  {id:"1b028",name:"Triston Casas",        team:"BOS",pos:"1B",mlbId:"671213",proj:{R:38,HR:14,RBI:47, SB:0, AVG:.239},stats2025:{R:5,HR:3,RBI:11,SB:0,AVG:0.182}},
  {id:"1b029",name:"CJ Kayfus",            team:"CLE",pos:"1B",mlbId:"692216",proj:{R:61,HR:13,RBI:64, SB:6, AVG:.249},stats2025:{R:16,HR:4,RBI:19,SB:4,AVG:0.22}},
  {id:"1b030",name:"Andrew Vaughn",        team:"MIL",pos:"1B",mlbId:"683734",proj:{R:54,HR:20,RBI:81, SB:0, AVG:.244},stats2025:{R:35,HR:14,RBI:65,SB:0,AVG:0.254}},
  {id:"1b031",name:"Ryan O'Hearn",         team:"PIT",pos:"1B",mlbId:"656811",proj:{R:56,HR:13,RBI:51, SB:3, AVG:.265},stats2025:{R:67,HR:17,RBI:63,SB:3,AVG:0.281}},
  {id:"1b032",name:"Ryan Mountcastle",     team:"BAL",pos:"1B",mlbId:"663624",proj:{R:51,HR:17,RBI:59, SB:3, AVG:.260},stats2025:{R:34,HR:7,RBI:35,SB:3,AVG:0.25}},
  {id:"1b033",name:"Edouard Julien",       team:"COL",pos:"1B",mlbId:"666397",proj:{R:57,HR:12,RBI:51, SB:5, AVG:.257},stats2025:{R:13,HR:3,RBI:12,SB:0,AVG:0.22}},
  {id:"1b034",name:"Nolan Schanuel",       team:"LAA",pos:"1B",mlbId:"694384",proj:{R:67,HR:12,RBI:58, SB:5, AVG:.261},stats2025:{R:64,HR:12,RBI:53,SB:5,AVG:0.264}},
  {id:"1b035",name:"Josh Bell",            team:"MIN",pos:"1B",mlbId:"605137",proj:{R:53,HR:17,RBI:62, SB:0, AVG:.252},stats2025:{R:54,HR:22,RBI:63,SB:0,AVG:0.237}},
  {id:"1b036",name:"Jake Burger",          team:"TEX",pos:"1B",mlbId:"669394",eligPos:["1B","3B"],proj:{R:55,HR:21,RBI:67, SB:1, AVG:.236},stats2025:{R:43,HR:16,RBI:53,SB:1,AVG:0.236}},
  {id:"1b037",name:"Blaine Crim",          team:"COL",pos:"1B",mlbId:"688760",proj:{R:68,HR:18,RBI:70, SB:3, AVG:.268},stats2025:{R:10,HR:5,RBI:12,SB:0,AVG:0.200}},
  {id:"1b038",name:"Tyler Locklear",       team:"ARI",pos:"1B",mlbId:"682988",proj:{R:64,HR:14,RBI:70, SB:11,AVG:.249},stats2025:{R:11,HR:3,RBI:6,SB:3,AVG:0.175}},
  {id:"1b039",name:"Kody Clemens",         team:"MIN",pos:"1B",mlbId:"665019",proj:{R:49,HR:16,RBI:51, SB:4, AVG:.230},stats2025:{R:46,HR:19,RBI:52,SB:5,AVG:0.213}},
  {id:"1b040",name:"Jonathon Long",        team:"CHC",pos:"1B",mlbId:"675085",proj:{R:68,HR:14,RBI:67, SB:1, AVG:.246}},
].sort((a,b) => pts(b.proj) - pts(a.proj));

const SECONDBASE_POOL = [
  {id:"2b001",name:"Ketel Marte",         team:"ARI",pos:"2B",mlbId:"606466",proj:{R:81,HR:24,RBI:78, SB:5, AVG:.267},stats2025:{R:87,HR:28,RBI:72,SB:4,AVG:0.283}},
  {id:"2b002",name:"Nico Hoerner",        team:"CHC",pos:"2B",mlbId:"663538",proj:{R:82,HR:9, RBI:62, SB:26,AVG:.278},stats2025:{R:89,HR:7,RBI:61,SB:29,AVG:0.297}},
  {id:"2b003",name:"Jazz Chisholm Jr.",   team:"NYY",pos:"2B",mlbId:"665862",proj:{R:71,HR:25,RBI:83, SB:29,AVG:.235},stats2025:{R:75,HR:31,RBI:80,SB:31,AVG:0.242}},
  {id:"2b004",name:"Jordan Westburg",     team:"BAL",pos:"2B",mlbId:"676059",proj:{R:69,HR:21,RBI:66, SB:4, AVG:.260},stats2025:{R:59,HR:17,RBI:41,SB:1,AVG:0.265}},
  {id:"2b005",name:"Gleyber Torres",      team:"DET",pos:"2B",mlbId:"650402",proj:{R:79,HR:18,RBI:72, SB:6, AVG:.261},stats2025:{R:79,HR:16,RBI:74,SB:4,AVG:0.256}},
  {id:"2b006",name:"Jose Altuve",         team:"HOU",pos:"2B",mlbId:"514888",proj:{R:75,HR:18,RBI:65, SB:11,AVG:.265},stats2025:{R:80,HR:26,RBI:77,SB:10,AVG:0.265}},
  {id:"2b007",name:"Brice Turang",        team:"MIL",pos:"2B",mlbId:"668930",proj:{R:79,HR:13,RBI:67, SB:27,AVG:.258},stats2025:{R:97,HR:18,RBI:81,SB:24,AVG:0.288}},
  {id:"2b008",name:"Bryson Stott",        team:"PHI",pos:"2B",mlbId:"681082",proj:{R:68,HR:12,RBI:62, SB:23,AVG:.259},stats2025:{R:66,HR:13,RBI:66,SB:24,AVG:0.257}},
  {id:"2b009",name:"Marcus Semien",       team:"NYM",pos:"2B",mlbId:"543760",proj:{R:80,HR:17,RBI:69, SB:9, AVG:.244},stats2025:{R:62,HR:15,RBI:62,SB:11,AVG:0.23}},
  {id:"2b010",name:"Jackson Holliday",    team:"BAL",pos:"2B",mlbId:"702616",proj:{R:86,HR:19,RBI:69, SB:16,AVG:.247},stats2025:{R:70,HR:17,RBI:55,SB:17,AVG:0.242}},
  {id:"2b011",name:"Jeff McNeil",         team:"ATH",pos:"2B",mlbId:"643446",proj:{R:56,HR:11,RBI:54, SB:4, AVG:.279},stats2025:{R:42,HR:12,RBI:54,SB:3,AVG:0.243}},
  {id:"2b012",name:"Matt McLain",         team:"CIN",pos:"2B",mlbId:"680574",proj:{R:73,HR:17,RBI:64, SB:18,AVG:.237},stats2025:{R:73,HR:15,RBI:50,SB:18,AVG:0.22}},
  {id:"2b013",name:"Andres Gimenez",      team:"TOR",pos:"2B",mlbId:"665926",proj:{R:60,HR:12,RBI:60, SB:19,AVG:.249},stats2025:{R:39,HR:7,RBI:35,SB:12,AVG:0.21}},
  {id:"2b014",name:"Brett Baty",          team:"NYM",pos:"2B",mlbId:"683146",proj:{R:59,HR:19,RBI:61, SB:5, AVG:.251},stats2025:{R:53,HR:18,RBI:50,SB:8,AVG:0.254}},
  {id:"2b015",name:"Jorge Polanco",       team:"NYM",pos:"2B",mlbId:"593871",proj:{R:56,HR:21,RBI:69, SB:4, AVG:.253},stats2025:{R:64,HR:26,RBI:78,SB:6,AVG:0.265}},
  {id:"2b016",name:"Ozzie Albies",        team:"ATL",pos:"2B",mlbId:"645277",proj:{R:73,HR:18,RBI:70, SB:11,AVG:.250},stats2025:{R:74,HR:16,RBI:74,SB:14,AVG:0.24}},
  {id:"2b017",name:"Xavier Edwards",      team:"MIA",pos:"2B",mlbId:"669364",proj:{R:67,HR:4, RBI:48, SB:25,AVG:.276},stats2025:{R:75,HR:3,RBI:43,SB:27,AVG:0.283}},
  {id:"2b018",name:"Shay Whitcomb",       team:"HOU",pos:"2B",mlbId:"694376",proj:{R:65,HR:21,RBI:70, SB:12,AVG:.230},stats2025:{R:4,HR:1,RBI:1,SB:0,AVG:0.125}},
  {id:"2b019",name:"Tommy Edman",         team:"LAD",pos:"2B",mlbId:"669242",proj:{R:56,HR:13,RBI:50, SB:10,AVG:.251},stats2025:{R:49,HR:13,RBI:49,SB:3,AVG:0.225}},
  {id:"2b020",name:"Zack Gelof",          team:"ATH",pos:"2B",mlbId:"680869",proj:{R:62,HR:17,RBI:62, SB:15,AVG:.234},stats2025:{R:12,HR:2,RBI:7,SB:1,AVG:0.174}},
  {id:"2b021",name:"Hao-Yu Lee",          team:"DET",pos:"2B",mlbId:"701678",proj:{R:68,HR:13,RBI:64, SB:12,AVG:.239}},
  {id:"2b022",name:"Luis Arraez",         team:"SFG",pos:"2B",mlbId:"650333",proj:{R:72,HR:6, RBI:64, SB:8, AVG:.311},stats2025:{R:66,HR:8,RBI:61,SB:11,AVG:0.292}},
  {id:"2b023",name:"Brendan Donovan",     team:"SEA",pos:"2B",mlbId:"680977",proj:{R:63,HR:11,RBI:54, SB:3, AVG:.273},stats2025:{R:64,HR:10,RBI:50,SB:3,AVG:0.287}},
  {id:"2b024",name:"Travis Bazzana",      team:"CLE",pos:"2B",mlbId:"683953",proj:{R:65,HR:10,RBI:48, SB:7, AVG:.219}},
  {id:"2b025",name:"Davis Schneider",     team:"TOR",pos:"2B",mlbId:"676914",proj:{R:56,HR:18,RBI:58, SB:6, AVG:.222},stats2025:{R:33,HR:11,RBI:31,SB:3,AVG:0.234}},
  {id:"2b026",name:"Max Anderson",        team:"DET",pos:"2B",mlbId:"801194",proj:{R:69,HR:16,RBI:73, SB:2, AVG:.255}},
  {id:"2b027",name:"Colt Keith",          team:"DET",pos:"2B",mlbId:"690993",proj:{R:71,HR:16,RBI:71, SB:2, AVG:.265},stats2025:{R:65,HR:13,RBI:45,SB:1,AVG:0.256}},
  {id:"2b028",name:"Ronny Mauricio",      team:"NYM",pos:"2B",mlbId:"677595",proj:{R:54,HR:15,RBI:53, SB:13,AVG:.242},stats2025:{R:19,HR:6,RBI:10,SB:4,AVG:0.226}},
  {id:"2b029",name:"Luke Keaschall",      team:"MIN",pos:"2B",mlbId:"807712",proj:{R:49,HR:7, RBI:44, SB:17,AVG:.264},stats2025:{R:25,HR:4,RBI:28,SB:14,AVG:0.302}},
  {id:"2b030",name:"Nick Gonzales",       team:"PIT",pos:"2B",mlbId:"693304",proj:{R:57,HR:9, RBI:52, SB:2, AVG:.265},stats2025:{R:39,HR:5,RBI:30,SB:0,AVG:0.26}},
  {id:"2b031",name:"Ryan Ritter",         team:"COL",pos:"2B",mlbId:"690022",proj:{R:63,HR:12,RBI:59, SB:7, AVG:.259},stats2025:{R:22,HR:1,RBI:18,SB:3,AVG:0.241}},
  {id:"2b032",name:"Otto Lopez",          team:"MIA",pos:"2B",mlbId:"672640",proj:{R:61,HR:10,RBI:58, SB:13,AVG:.261},stats2025:{R:66,HR:15,RBI:77,SB:15,AVG:0.246}},
  {id:"2b033",name:"Nolan Gorman",        team:"STL",pos:"2B",mlbId:"669357",proj:{R:57,HR:21,RBI:61, SB:3, AVG:.223},stats2025:{R:48,HR:14,RBI:46,SB:1,AVG:0.205}},
  {id:"2b034",name:"Tyler Fitzgerald",    team:"SFG",pos:"2B",mlbId:"666149",proj:{R:62,HR:14,RBI:58, SB:13,AVG:.240},stats2025:{R:19,HR:4,RBI:14,SB:9,AVG:0.217}},
  {id:"2b035",name:"Luis Garcia Jr.",     team:"WSN",pos:"2B",mlbId:"671277",proj:{R:68,HR:16,RBI:70, SB:13,AVG:.271},stats2025:{R:67,HR:16,RBI:66,SB:14,AVG:0.252}},
].sort((a,b) => pts(b.proj) - pts(a.proj));

const THIRDBASE_POOL = [
  {id:"3b001",name:"Jose Ramirez",     team:"CLE",pos:"3B",mlbId:"608070",proj:{R:91,HR:26,RBI:88, SB:28,AVG:.271},stats2025:{R:103,HR:30,RBI:85,SB:44,AVG:0.283}},
  {id:"3b002",name:"Junior Caminero",  team:"TBR",pos:"3B",mlbId:"691406",proj:{R:83,HR:36,RBI:115,SB:6, AVG:.270},stats2025:{R:93,HR:45,RBI:110,SB:7,AVG:0.264}},
  {id:"3b003",name:"Rafael Devers",    team:"SFG",pos:"3B",mlbId:"646240",proj:{R:91,HR:30,RBI:94, SB:2, AVG:.257},stats2025:{R:99,HR:35,RBI:109,SB:1,AVG:0.252}},
  {id:"3b004",name:"Matt Chapman",     team:"SFG",pos:"3B",mlbId:"656305",proj:{R:79,HR:23,RBI:66, SB:7, AVG:.245},stats2025:{R:76,HR:21,RBI:61,SB:9,AVG:0.231}},
  {id:"3b005",name:"Manny Machado",    team:"SDP",pos:"3B",mlbId:"592518",proj:{R:76,HR:23,RBI:84, SB:9, AVG:.258},stats2025:{R:91,HR:27,RBI:95,SB:14,AVG:0.275}},
  {id:"3b006",name:"Austin Riley",     team:"ATL",pos:"3B",mlbId:"663586",proj:{R:72,HR:25,RBI:72, SB:2, AVG:.262},stats2025:{R:54,HR:16,RBI:54,SB:2,AVG:0.26}},
  {id:"3b007",name:"Maikel Garcia",    team:"KCR",pos:"3B",mlbId:"672580",proj:{R:82,HR:11,RBI:67, SB:25,AVG:.263},stats2025:{R:81,HR:16,RBI:74,SB:23,AVG:0.286}},
  {id:"3b008",name:"Jordan Westburg",  team:"BAL",pos:"3B",mlbId:"676059",proj:{R:69,HR:21,RBI:66, SB:4, AVG:.260},stats2025:{R:59,HR:17,RBI:41,SB:1,AVG:0.265}},
  {id:"3b009",name:"Alex Bregman",     team:"CHC",pos:"3B",mlbId:"608324",proj:{R:71,HR:18,RBI:70, SB:2, AVG:.240},stats2025:{R:64,HR:18,RBI:62,SB:1,AVG:0.273}},
  {id:"3b010",name:"Yandy Diaz",       team:"TBR",pos:"3B",mlbId:"650490",proj:{R:70,HR:17,RBI:74, SB:2, AVG:.296},stats2025:{R:79,HR:25,RBI:83,SB:3,AVG:0.3}},
  {id:"3b011",name:"Alec Bohm",        team:"PHI",pos:"3B",mlbId:"664761",proj:{R:64,HR:15,RBI:72, SB:3, AVG:.282},stats2025:{R:53,HR:11,RBI:59,SB:2,AVG:0.287}},
  {id:"3b012",name:"Isaac Paredes",    team:"HOU",pos:"3B",mlbId:"670623",proj:{R:60,HR:21,RBI:73, SB:0, AVG:.239},stats2025:{R:53,HR:20,RBI:53,SB:0,AVG:0.254}},
  {id:"3b013",name:"Kazuma Okamoto",   team:"TOR",pos:"3B",mlbId:"672960",proj:{R:58,HR:23,RBI:82, SB:1, AVG:.251}},
  {id:"3b014",name:"Eugenio Suarez",   team:"CIN",pos:"3B",mlbId:"553993",proj:{R:78,HR:35,RBI:99, SB:3, AVG:.236},stats2025:{R:91,HR:49,RBI:118,SB:4,AVG:0.228}},
  {id:"3b015",name:"Mark Vientos",     team:"NYM",pos:"3B",mlbId:"668901",proj:{R:59,HR:22,RBI:77, SB:1, AVG:.252},stats2025:{R:44,HR:17,RBI:61,SB:1,AVG:0.233}},
  {id:"3b016",name:"Caleb Durbin",     team:"BOS",pos:"3B",mlbId:"702332",proj:{R:65,HR:10,RBI:57, SB:20,AVG:.249},stats2025:{R:60,HR:11,RBI:53,SB:18,AVG:0.256}},
  {id:"3b017",name:"Matt Shaw",        team:"CHC",pos:"3B",mlbId:"807713",proj:{R:69,HR:16,RBI:65, SB:19,AVG:.245},stats2025:{R:57,HR:13,RBI:44,SB:17,AVG:0.226}},
  {id:"3b018",name:"Jace Jung",        team:"DET",pos:"3B",mlbId:"690291",proj:{R:65,HR:18,RBI:69, SB:3, AVG:.226},stats2025:{R:8,HR:0,RBI:3,SB:0,AVG:0.106}},
  {id:"3b019",name:"Addison Barger",   team:"TOR",pos:"3B",mlbId:"680718",proj:{R:65,HR:21,RBI:75, SB:4, AVG:.244},stats2025:{R:61,HR:21,RBI:74,SB:4,AVG:0.243}},
  {id:"3b020",name:"Connor Norby",     team:"MIA",pos:"3B",mlbId:"681393",proj:{R:71,HR:16,RBI:63, SB:9, AVG:.248},stats2025:{R:42,HR:8,RBI:34,SB:8,AVG:0.251}},
  {id:"3b021",name:"Nolan Arenado",    team:"ARI",pos:"3B",mlbId:"571448",proj:{R:51,HR:13,RBI:64, SB:3, AVG:.251},stats2025:{R:48,HR:12,RBI:52,SB:3,AVG:0.237}},
  {id:"3b022",name:"Royce Lewis",      team:"MIN",pos:"3B",mlbId:"668904",proj:{R:45,HR:14,RBI:54, SB:9, AVG:.251},stats2025:{R:36,HR:13,RBI:52,SB:12,AVG:0.237}},
  {id:"3b023",name:"Joey Ortiz",       team:"MIL",pos:"3B",mlbId:"687401",proj:{R:61,HR:9, RBI:54, SB:11,AVG:.247},stats2025:{R:62,HR:7,RBI:45,SB:14,AVG:0.23}},
  {id:"3b024",name:"Jared Triolo",     team:"PIT",pos:"3B",mlbId:"669707",proj:{R:51,HR:7, RBI:40, SB:13,AVG:.248},stats2025:{R:41,HR:7,RBI:24,SB:13,AVG:0.227}},
  {id:"3b025",name:"Nolan Gorman",     team:"STL",pos:"3B",mlbId:"669357",proj:{R:57,HR:21,RBI:61, SB:3, AVG:.223},stats2025:{R:48,HR:14,RBI:46,SB:1,AVG:0.205}},
  {id:"3b026",name:"Josh Smith",       team:"TEX",pos:"3B",mlbId:"669701",proj:{R:65,HR:10,RBI:45, SB:10,AVG:.243},stats2025:{R:70,HR:10,RBI:35,SB:12,AVG:0.251}},
  {id:"3b027",name:"Noelvi Marte",     team:"CIN",pos:"3B",mlbId:"682622",proj:{R:57,HR:13,RBI:57, SB:13,AVG:.252},stats2025:{R:45,HR:14,RBI:51,SB:10,AVG:0.263}},
  {id:"3b028",name:"Darell Hernaiz",   team:"ATH",pos:"3B",mlbId:"687231",proj:{R:66,HR:7, RBI:61, SB:10,AVG:.261},stats2025:{R:17,HR:2,RBI:16,SB:3,AVG:0.231}},
  {id:"3b029",name:"Josh Jung",        team:"TEX",pos:"3B",mlbId:"673962",proj:{R:53,HR:14,RBI:56, SB:3, AVG:.242},stats2025:{R:53,HR:14,RBI:61,SB:4,AVG:0.251}},
  {id:"3b030",name:"Ronny Mauricio",   team:"NYM",pos:"3B",mlbId:"677595",proj:{R:54,HR:15,RBI:53, SB:13,AVG:.242},stats2025:{R:19,HR:6,RBI:10,SB:4,AVG:0.226}},
].sort((a,b) => pts(b.proj) - pts(a.proj));

const SHORTSTOP_POOL = [
  {id:"ss001",name:"Bobby Witt Jr.",     team:"KCR",pos:"SS",mlbId:"677951",proj:{R:98,HR:27,RBI:93, SB:32,AVG:.283},stats2025:{R:99,HR:23,RBI:88,SB:38,AVG:0.295}},
  {id:"ss002",name:"Gunnar Henderson",   team:"BAL",pos:"SS",mlbId:"683002",proj:{R:99,HR:28,RBI:90, SB:21,AVG:.272},stats2025:{R:85,HR:17,RBI:68,SB:30,AVG:0.274}},
  {id:"ss003",name:"Francisco Lindor",   team:"NYM",pos:"SS",mlbId:"596019",proj:{R:102,HR:27,RBI:90,SB:23,AVG:.263},stats2025:{R:117,HR:31,RBI:86,SB:31,AVG:0.267}},
  {id:"ss004",name:"Fernando Tatis Jr.", team:"SDP",pos:"SS",mlbId:"665487",proj:{R:101,HR:26,RBI:80,SB:25,AVG:.265},stats2025:{R:111,HR:25,RBI:71,SB:32,AVG:0.268}},
  {id:"ss005",name:"Mookie Betts",       team:"LAD",pos:"SS",mlbId:"605141",proj:{R:91,HR:23,RBI:87, SB:9, AVG:.274},stats2025:{R:95,HR:20,RBI:82,SB:8,AVG:0.258}},
  {id:"ss006",name:"Trea Turner",        team:"PHI",pos:"SS",mlbId:"607208",proj:{R:87,HR:18,RBI:73, SB:26,AVG:.285},stats2025:{R:94,HR:15,RBI:69,SB:36,AVG:0.304}},
  {id:"ss007",name:"Elly De La Cruz",    team:"CIN",pos:"SS",mlbId:"682829",proj:{R:100,HR:23,RBI:87,SB:40,AVG:.261},stats2025:{R:102,HR:22,RBI:86,SB:37,AVG:0.264}},
  {id:"ss008",name:"Willy Adames",       team:"SFG",pos:"SS",mlbId:"642715",proj:{R:85,HR:26,RBI:85, SB:11,AVG:.240},stats2025:{R:94,HR:30,RBI:87,SB:12,AVG:0.225}},
  {id:"ss009",name:"Bo Bichette",        team:"NYM",pos:"SS",mlbId:"666182",proj:{R:73,HR:17,RBI:80, SB:5, AVG:.294},stats2025:{R:78,HR:18,RBI:94,SB:4,AVG:0.311}},
  {id:"ss010",name:"Geraldo Perdomo",    team:"ARI",pos:"SS",mlbId:"672695",proj:{R:86,HR:13,RBI:68, SB:20,AVG:.262},stats2025:{R:98,HR:20,RBI:100,SB:27,AVG:0.29}},
  {id:"ss011",name:"Zach Neto",          team:"LAA",pos:"SS",mlbId:"687263",proj:{R:85,HR:25,RBI:82, SB:23,AVG:.258},stats2025:{R:82,HR:26,RBI:62,SB:26,AVG:0.257}},
  {id:"ss012",name:"Corey Seager",       team:"TEX",pos:"SS",mlbId:"608369",proj:{R:64,HR:21,RBI:63, SB:2, AVG:.260},stats2025:{R:61,HR:21,RBI:50,SB:3,AVG:0.271}},
  {id:"ss013",name:"Nico Hoerner",       team:"CHC",pos:"SS",mlbId:"663538",proj:{R:82,HR:9, RBI:62, SB:26,AVG:.278},stats2025:{R:89,HR:7,RBI:61,SB:29,AVG:0.297}},
  {id:"ss014",name:"Dansby Swanson",     team:"CHC",pos:"SS",mlbId:"621020",proj:{R:78,HR:19,RBI:71, SB:14,AVG:.241},stats2025:{R:84,HR:24,RBI:77,SB:20,AVG:0.244}},
  {id:"ss015",name:"Jeremy Pena",        team:"HOU",pos:"SS",mlbId:"665161",proj:{R:73,HR:16,RBI:66, SB:16,AVG:.269},stats2025:{R:68,HR:17,RBI:62,SB:20,AVG:0.304}},
  {id:"ss016",name:"Konnor Griffin",     team:"PIT",pos:"SS",mlbId:"804606",proj:{R:101,HR:14,RBI:76,SB:32,AVG:.261}},
  {id:"ss017",name:"Masyn Winn",         team:"STL",pos:"SS",mlbId:"691026",proj:{R:79,HR:12,RBI:61, SB:12,AVG:.250},stats2025:{R:72,HR:9,RBI:51,SB:9,AVG:0.253}},
  {id:"ss018",name:"Oneil Cruz",         team:"PIT",pos:"SS",mlbId:"665833",proj:{R:73,HR:23,RBI:70, SB:31,AVG:.237},stats2025:{R:62,HR:20,RBI:61,SB:38,AVG:0.2}},
  {id:"ss019",name:"Carlos Correa",      team:"HOU",pos:"SS",mlbId:"621043",proj:{R:59,HR:16,RBI:58, SB:0, AVG:.257},stats2025:{R:63,HR:13,RBI:52,SB:0,AVG:0.276}},
  {id:"ss020",name:"CJ Abrams",          team:"WSN",pos:"SS",mlbId:"682928",proj:{R:90,HR:19,RBI:73, SB:31,AVG:.254},stats2025:{R:92,HR:19,RBI:60,SB:31,AVG:0.257}},
  {id:"ss021",name:"Ezequiel Tovar",     team:"COL",pos:"SS",mlbId:"678662",proj:{R:68,HR:17,RBI:65, SB:6, AVG:.269},stats2025:{R:44,HR:9,RBI:33,SB:5,AVG:0.253}},
  {id:"ss022",name:"Carson Williams",    team:"TBR",pos:"SS",mlbId:"700246",proj:{R:74,HR:21,RBI:72, SB:16,AVG:.221},stats2025:{R:11,HR:5,RBI:12,SB:2,AVG:0.172}},
  {id:"ss023",name:"Xavier Edwards",     team:"MIA",pos:"SS",mlbId:"669364",proj:{R:67,HR:4, RBI:48, SB:25,AVG:.276},stats2025:{R:75,HR:3,RBI:43,SB:27,AVG:0.283}},
  {id:"ss024",name:"Anthony Volpe",      team:"NYY",pos:"SS",mlbId:"683011",proj:{R:71,HR:17,RBI:70, SB:22,AVG:.225},stats2025:{R:65,HR:19,RBI:72,SB:18,AVG:0.212}},
  {id:"ss025",name:"Jacob Wilson",       team:"ATH",pos:"SS",mlbId:"805779",proj:{R:62,HR:10,RBI:69, SB:4, AVG:.289},stats2025:{R:62,HR:13,RBI:63,SB:5,AVG:0.311}},
  {id:"ss026",name:"Trevor Story",       team:"BOS",pos:"SS",mlbId:"596115",proj:{R:68,HR:18,RBI:75, SB:20,AVG:.255},stats2025:{R:91,HR:25,RBI:96,SB:31,AVG:0.263}},
  {id:"ss027",name:"Colson Montgomery",  team:"CHW",pos:"SS",mlbId:"695657",proj:{R:63,HR:23,RBI:83, SB:2, AVG:.216},stats2025:{R:43,HR:21,RBI:55,SB:0,AVG:0.239}},
  {id:"ss028",name:"Jett Williams",      team:"MIL",pos:"SS",mlbId:"702518",proj:{R:75,HR:13,RBI:68, SB:18,AVG:.227}},
  {id:"ss029",name:"Ha-Seong Kim",       team:"ATL",pos:"SS",mlbId:"673490",proj:{R:51,HR:9, RBI:44, SB:17,AVG:.244},stats2025:{R:19,HR:5,RBI:17,SB:6,AVG:0.234}},
  {id:"ss030",name:"JP Crawford",        team:"SEA",pos:"SS",mlbId:"641487",proj:{R:64,HR:11,RBI:55, SB:5, AVG:.236},stats2025:{R:69,HR:12,RBI:58,SB:8,AVG:0.265}},
].sort((a,b) => pts(b.proj) - pts(a.proj));

const OUTFIELD_POOL = [
  {id:"of001",name:"Aaron Judge",team:"NYY",pos:"OF",mlbId:"592450",proj:{R:107,HR:42,RBI:115,SB:8,AVG:0.288},stats2025:{R:137,HR:53,RBI:114,SB:12,AVG:0.331}},
  {id:"of002",name:"Juan Soto",team:"NYM",pos:"OF",mlbId:"665742",proj:{R:109,HR:37,RBI:103,SB:23,AVG:0.271},stats2025:{R:120,HR:43,RBI:105,SB:38,AVG:0.263}},
  {id:"of003",name:"Corbin Carroll",team:"ARI",pos:"OF",mlbId:"682998",proj:{R:112,HR:27,RBI:92,SB:35,AVG:0.256},stats2025:{R:107,HR:31,RBI:84,SB:32,AVG:0.259}},
  {id:"of004",name:"Brent Rooker",team:"ATH",pos:"OF",mlbId:"667670",proj:{R:84,HR:34,RBI:110,SB:6,AVG:0.275},stats2025:{R:92,HR:30,RBI:89,SB:6,AVG:0.262}},
  {id:"of005",name:"Kyle Schwarber",team:"PHI",pos:"OF",mlbId:"656941",proj:{R:97,HR:43,RBI:109,SB:7,AVG:0.223},stats2025:{R:111,HR:56,RBI:132,SB:10,AVG:0.24}},
  {id:"of006",name:"Kyle Tucker",team:"LAD",pos:"OF",mlbId:"663656",proj:{R:87,HR:31,RBI:96,SB:21,AVG:0.268},stats2025:{R:91,HR:22,RBI:73,SB:25,AVG:0.266}},
  {id:"of007",name:"James Wood",team:"WSN",pos:"OF",mlbId:"695578",proj:{R:88,HR:26,RBI:93,SB:15,AVG:0.263},stats2025:{R:87,HR:31,RBI:94,SB:15,AVG:0.256}},
  {id:"of008",name:"Fernando Tatis Jr.",team:"SDP",pos:"OF",mlbId:"665487",proj:{R:101,HR:26,RBI:80,SB:25,AVG:0.265},stats2025:{R:111,HR:25,RBI:71,SB:32,AVG:0.268}},
  {id:"of009",name:"Ronald Acuña Jr.",team:"ATL",pos:"OF",mlbId:"660670",proj:{R:101,HR:27,RBI:71,SB:24,AVG:0.286},stats2025:{R:74,HR:21,RBI:42,SB:9,AVG:0.29}},
  {id:"of010",name:"Julio Rodríguez",team:"SEA",pos:"OF",mlbId:"677594",proj:{R:94,HR:29,RBI:98,SB:27,AVG:0.266},stats2025:{R:106,HR:32,RBI:95,SB:30,AVG:0.267}},
  {id:"of011",name:"Mookie Betts",team:"LAD",pos:"OF",mlbId:"605141",proj:{R:91,HR:23,RBI:87,SB:9,AVG:0.274},stats2025:{R:95,HR:20,RBI:82,SB:8,AVG:0.258}},
  {id:"of012",name:"Riley Greene",team:"DET",pos:"OF",mlbId:"682985",proj:{R:83,HR:29,RBI:98,SB:3,AVG:0.268},stats2025:{R:84,HR:36,RBI:111,SB:2,AVG:0.258}},
  {id:"of013",name:"Seiya Suzuki",team:"CHC",pos:"OF",mlbId:"673548",proj:{R:74,HR:26,RBI:86,SB:7,AVG:0.259},stats2025:{R:75,HR:32,RBI:103,SB:5,AVG:0.245}},
  {id:"of014",name:"Jackson Chourio",team:"MIL",pos:"OF",mlbId:"694192",proj:{R:91,HR:22,RBI:94,SB:23,AVG:0.274},stats2025:{R:88,HR:21,RBI:78,SB:21,AVG:0.27}},
  {id:"of015",name:"Jarren Duran",team:"BOS",pos:"OF",mlbId:"680776",proj:{R:86,HR:17,RBI:75,SB:23,AVG:0.259},stats2025:{R:86,HR:16,RBI:84,SB:24,AVG:0.256}},
  {id:"of016",name:"Bryce Harper",team:"PHI",pos:"OF",mlbId:"547180",proj:{R:73,HR:24,RBI:78,SB:10,AVG:0.274},stats2025:{R:72,HR:27,RBI:75,SB:12,AVG:0.261}},
  {id:"of017",name:"Wyatt Langford",team:"TEX",pos:"OF",mlbId:"694671",proj:{R:83,HR:23,RBI:75,SB:21,AVG:0.259},stats2025:{R:73,HR:22,RBI:62,SB:22,AVG:0.241}},
  {id:"of018",name:"Ian Happ",team:"CHC",pos:"OF",mlbId:"664023",proj:{R:82,HR:22,RBI:79,SB:8,AVG:0.245},stats2025:{R:87,HR:23,RBI:79,SB:6,AVG:0.243}},
  {id:"of019",name:"Roman Anthony",team:"BOS",pos:"OF",mlbId:"701350",proj:{R:88,HR:18,RBI:71,SB:8,AVG:0.267},stats2025:{R:48,HR:8,RBI:32,SB:4,AVG:0.292}},
  {id:"of020",name:"Pete Crow-Armstrong",team:"CHC",pos:"OF",mlbId:"691718",proj:{R:91,HR:25,RBI:91,SB:32,AVG:0.255},stats2025:{R:91,HR:31,RBI:95,SB:35,AVG:0.247}},
  {id:"of021",name:"Yordan Alvarez",team:"HOU",pos:"OF",mlbId:"670541",proj:{R:64,HR:24,RBI:72,SB:2,AVG:0.289},stats2025:{R:17,HR:6,RBI:27,SB:1,AVG:0.273}},
  {id:"of022",name:"Randy Arozarena",team:"SEA",pos:"OF",mlbId:"668227",proj:{R:82,HR:22,RBI:75,SB:25,AVG:0.233},stats2025:{R:95,HR:27,RBI:76,SB:31,AVG:0.238}},
  {id:"of023",name:"Michael Harris II",team:"ATL",pos:"OF",mlbId:"671739",proj:{R:74,HR:22,RBI:80,SB:19,AVG:0.275},stats2025:{R:55,HR:20,RBI:86,SB:20,AVG:0.249}},
  {id:"of024",name:"Teoscar Hernández",team:"LAD",pos:"OF",mlbId:"606192",proj:{R:71,HR:28,RBI:92,SB:6,AVG:0.266},stats2025:{R:65,HR:25,RBI:89,SB:5,AVG:0.247}},
  {id:"of025",name:"Heliot Ramos",team:"SFG",pos:"OF",mlbId:"671218",proj:{R:80,HR:22,RBI:81,SB:6,AVG:0.259},stats2025:{R:85,HR:21,RBI:69,SB:6,AVG:0.256}},
  {id:"of026",name:"Taylor Ward",team:"BAL",pos:"OF",mlbId:"621493",proj:{R:74,HR:27,RBI:85,SB:4,AVG:0.243},stats2025:{R:86,HR:36,RBI:103,SB:4,AVG:0.228}},
  {id:"of027",name:"Cody Bellinger",team:"NYY",pos:"OF",mlbId:"641355",proj:{R:84,HR:22,RBI:90,SB:12,AVG:0.264},stats2025:{R:89,HR:29,RBI:98,SB:13,AVG:0.272}},
  {id:"of028",name:"Steven Kwan",team:"CLE",pos:"OF",mlbId:"680757",proj:{R:84,HR:10,RBI:61,SB:18,AVG:0.281},stats2025:{R:81,HR:11,RBI:56,SB:21,AVG:0.272}},
  {id:"of029",name:"Andy Pages",team:"LAD",pos:"OF",mlbId:"681624",proj:{R:73,HR:25,RBI:84,SB:9,AVG:0.258},stats2025:{R:74,HR:27,RBI:86,SB:14,AVG:0.272}},
  {id:"of030",name:"Marcell Ozuna",team:"PIT",pos:"OF",mlbId:"542303",proj:{R:66,HR:25,RBI:76,SB:0,AVG:0.248},stats2025:{R:61,HR:21,RBI:68,SB:0,AVG:0.232}},
  {id:"of031",name:"Oneil Cruz",team:"PIT",pos:"OF",mlbId:"665833",proj:{R:73,HR:23,RBI:70,SB:31,AVG:0.237},stats2025:{R:62,HR:20,RBI:61,SB:38,AVG:0.2}},
  {id:"of032",name:"George Springer",team:"TOR",pos:"OF",mlbId:"543807",proj:{R:80,HR:22,RBI:73,SB:13,AVG:0.256},stats2025:{R:106,HR:32,RBI:84,SB:18,AVG:0.309}},
  {id:"of033",name:"Jakob Marsee",team:"MIA",pos:"OF",mlbId:"805300",proj:{R:79,HR:15,RBI:73,SB:37,AVG:0.230},stats2025:{R:28,HR:5,RBI:33,SB:14,AVG:0.292}},
  {id:"of034",name:"Bryan Reynolds",team:"PIT",pos:"OF",mlbId:"668804",proj:{R:67,HR:17,RBI:71,SB:5,AVG:0.251},stats2025:{R:68,HR:16,RBI:73,SB:3,AVG:0.245}},
  {id:"of035",name:"Lawrence Butler",team:"ATH",pos:"OF",mlbId:"671732",proj:{R:80,HR:21,RBI:79,SB:18,AVG:0.248},stats2025:{R:83,HR:21,RBI:63,SB:22,AVG:0.234}},
  {id:"of036",name:"Ryan Ward",team:"LAD",pos:"OF",mlbId:"669899",proj:{R:81,HR:28,RBI:88,SB:8,AVG:0.234}},
  {id:"of037",name:"Jose Altuve",team:"HOU",pos:"OF",mlbId:"514888",proj:{R:75,HR:18,RBI:65,SB:11,AVG:0.265},stats2025:{R:80,HR:26,RBI:77,SB:10,AVG:0.265}},
  {id:"of038",name:"Brandon Nimmo",team:"TEX",pos:"OF",mlbId:"607043",proj:{R:75,HR:17,RBI:66,SB:9,AVG:0.244},stats2025:{R:81,HR:25,RBI:92,SB:13,AVG:0.262}},
  {id:"of039",name:"Tyler Soderstrom",team:"ATH",pos:"OF",mlbId:"691016",proj:{R:62,HR:23,RBI:86,SB:4,AVG:0.252},stats2025:{R:75,HR:25,RBI:93,SB:8,AVG:0.276}},
  {id:"of040",name:"Jackson Merrill",team:"SDP",pos:"OF",mlbId:"701538",proj:{R:71,HR:20,RBI:75,SB:6,AVG:0.270},stats2025:{R:59,HR:16,RBI:67,SB:1,AVG:0.264}},
  {id:"of041",name:"Jazz Chisholm Jr.",team:"NYY",pos:"OF",mlbId:"665862",proj:{R:71,HR:25,RBI:83,SB:29,AVG:0.235},stats2025:{R:75,HR:31,RBI:80,SB:31,AVG:0.242}},
  {id:"of042",name:"Ceddanne Rafaela",team:"BOS",pos:"OF",mlbId:"678882",proj:{R:83,HR:17,RBI:75,SB:20,AVG:0.264},stats2025:{R:84,HR:16,RBI:63,SB:20,AVG:0.249}},
  {id:"of043",name:"Matt Wallner",team:"MIN",pos:"OF",mlbId:"670242",proj:{R:63,HR:23,RBI:69,SB:4,AVG:0.239},stats2025:{R:47,HR:22,RBI:40,SB:4,AVG:0.202}},
  {id:"of044",name:"Christian Yelich",team:"MIL",pos:"OF",mlbId:"592885",proj:{R:76,HR:17,RBI:72,SB:16,AVG:0.254},stats2025:{R:88,HR:29,RBI:103,SB:16,AVG:0.264}},
  {id:"of045",name:"Byron Buxton",team:"MIN",pos:"OF",mlbId:"621439",proj:{R:75,HR:24,RBI:67,SB:14,AVG:0.250},stats2025:{R:97,HR:35,RBI:83,SB:24,AVG:0.264}},
  {id:"of046",name:"Dylan Beavers",team:"BAL",pos:"OF",mlbId:"687637",proj:{R:72,HR:17,RBI:66,SB:15,AVG:0.249},stats2025:{R:16,HR:4,RBI:14,SB:2,AVG:0.227}},
  {id:"of047",name:"Adolis García",team:"PHI",pos:"OF",mlbId:"666969",proj:{R:70,HR:25,RBI:85,SB:12,AVG:0.245},stats2025:{R:58,HR:19,RBI:75,SB:13,AVG:0.227}},
  {id:"of048",name:"Jac Caglianone",team:"KCR",pos:"OF",mlbId:"695506",proj:{R:64,HR:23,RBI:71,SB:3,AVG:0.254},stats2025:{R:19,HR:7,RBI:18,SB:1,AVG:0.157}},
  {id:"of049",name:"Jordan Beck",team:"COL",pos:"OF",mlbId:"687597",proj:{R:63,HR:16,RBI:60,SB:16,AVG:0.255},stats2025:{R:62,HR:16,RBI:53,SB:19,AVG:0.258}},
  {id:"of050",name:"Alec Burleson",team:"STL",pos:"OF",mlbId:"676475",proj:{R:58,HR:18,RBI:68,SB:5,AVG:0.274},stats2025:{R:54,HR:18,RBI:69,SB:5,AVG:0.29}},
  {id:"of051",name:"Ryan Clifford",team:"NYM",pos:"OF",mlbId:"691775",proj:{R:63,HR:25,RBI:79,SB:4,AVG:0.213}},
  {id:"of052",name:"Lars Nootbaar",team:"STL",pos:"OF",mlbId:"663457",proj:{R:68,HR:16,RBI:54,SB:5,AVG:0.245},stats2025:{R:68,HR:13,RBI:48,SB:4,AVG:0.234}},
  {id:"of053",name:"Sal Frelick",team:"MIL",pos:"OF",mlbId:"686217",proj:{R:72,HR:9,RBI:60,SB:17,AVG:0.271},stats2025:{R:76,HR:12,RBI:63,SB:19,AVG:0.288}},
  {id:"of054",name:"Trent Grisham",team:"NYY",pos:"OF",mlbId:"663757",proj:{R:71,HR:24,RBI:68,SB:6,AVG:0.216},stats2025:{R:87,HR:34,RBI:74,SB:3,AVG:0.235}},
  {id:"of055",name:"TJ Friedl",team:"CIN",pos:"OF",mlbId:"670770",proj:{R:67,HR:12,RBI:60,SB:13,AVG:0.240},stats2025:{R:82,HR:14,RBI:53,SB:12,AVG:0.261}},
  {id:"of056",name:"Kerry Carpenter",team:"DET",pos:"OF",mlbId:"681481",proj:{R:60,HR:24,RBI:81,SB:2,AVG:0.262},stats2025:{R:66,HR:26,RBI:62,SB:1,AVG:0.252}},
  {id:"of057",name:"Jeff McNeil",team:"ATH",pos:"OF",mlbId:"643446",proj:{R:56,HR:11,RBI:54,SB:4,AVG:0.279},stats2025:{R:42,HR:12,RBI:54,SB:3,AVG:0.243}},
  {id:"of058",name:"Anthony Santander",team:"TOR",pos:"OF",mlbId:"623993",proj:{R:59,HR:27,RBI:78,SB:1,AVG:0.228},stats2025:{R:16,HR:6,RBI:18,SB:0,AVG:0.175}},
  {id:"of059",name:"Colby Thomas",team:"ATH",pos:"OF",mlbId:"687515",proj:{R:67,HR:19,RBI:82,SB:8,AVG:0.246},stats2025:{R:20,HR:6,RBI:19,SB:2,AVG:0.225}},
  {id:"of060",name:"Brendan Donovan",team:"SEA",pos:"OF",mlbId:"680977",proj:{R:63,HR:11,RBI:54,SB:3,AVG:0.273},stats2025:{R:64,HR:10,RBI:50,SB:3,AVG:0.287}},
  {id:"of061",name:"Max Clark",team:"DET",pos:"OF",mlbId:"703601",proj:{R:77,HR:14,RBI:64,SB:10,AVG:0.243}},
  {id:"of062",name:"Addison Barger",team:"TOR",pos:"OF",mlbId:"680718",proj:{R:65,HR:21,RBI:75,SB:4,AVG:0.244},stats2025:{R:61,HR:21,RBI:74,SB:4,AVG:0.243}},
  {id:"of063",name:"Mike Trout",team:"LAA",pos:"OF",mlbId:"545361",proj:{R:62,HR:21,RBI:60,SB:2,AVG:0.235},stats2025:{R:73,HR:26,RBI:64,SB:2,AVG:0.232}},
  {id:"of064",name:"Justyn-Henry Malloy",team:"TBR",pos:"OF",mlbId:"669234",proj:{R:63,HR:14,RBI:63,SB:3,AVG:0.251},stats2025:{R:15,HR:1,RBI:17,SB:0,AVG:0.221}},
  {id:"of065",name:"Mickey Moniak",team:"COL",pos:"OF",mlbId:"666160",proj:{R:60,HR:20,RBI:65,SB:8,AVG:0.275},stats2025:{R:62,HR:24,RBI:68,SB:9,AVG:0.27}},
  {id:"of066",name:"Troy Johnston",team:"COL",pos:"OF",mlbId:"687859",proj:{R:58,HR:12,RBI:64,SB:15,AVG:0.268},stats2025:{R:12,HR:4,RBI:13,SB:2,AVG:0.277}},
  {id:"of067",name:"Jung Hoo Lee",team:"SFG",pos:"OF",mlbId:"808982",proj:{R:62,HR:9,RBI:56,SB:7,AVG:0.270},stats2025:{R:73,HR:8,RBI:55,SB:10,AVG:0.266}},
  {id:"of068",name:"Justin Crawford",team:"PHI",pos:"OF",mlbId:"702222",proj:{R:79,HR:7,RBI:56,SB:29,AVG:0.286}},
  {id:"of069",name:"Esteury Ruiz",team:"MIA",pos:"OF",mlbId:"665923",proj:{R:71,HR:11,RBI:60,SB:46,AVG:0.248},stats2025:{R:2,HR:1,RBI:2,SB:4,AVG:0.19}},
  {id:"of070",name:"Jurickson Profar",team:"ATL",pos:"OF",mlbId:"595777",proj:{R:64,HR:14,RBI:56,SB:7,AVG:0.252},stats2025:{R:56,HR:14,RBI:43,SB:9,AVG:0.245}},
  {id:"of071",name:"Spencer Jones",team:"NYY",pos:"OF",mlbId:"682987",proj:{R:74,HR:22,RBI:76,SB:17,AVG:0.229}},
  {id:"of072",name:"Kyle Stowers",team:"MIA",pos:"OF",mlbId:"669065",proj:{R:55,HR:21,RBI:67,SB:3,AVG:0.245},stats2025:{R:61,HR:25,RBI:73,SB:5,AVG:0.288}},
  {id:"of073",name:"Samad Taylor",team:"SDP",pos:"OF",mlbId:"669392",proj:{R:84,HR:10,RBI:60,SB:30,AVG:0.242},stats2025:{R:1,HR:0,RBI:0,SB:0,AVG:0.125}},
  {id:"of074",name:"Lourdes Gurriel Jr.",team:"ARI",pos:"OF",mlbId:"666971",proj:{R:55,HR:16,RBI:67,SB:7,AVG:0.264},stats2025:{R:52,HR:19,RBI:80,SB:10,AVG:0.248}},
  {id:"of075",name:"Drew Avans",team:"COL",pos:"OF",mlbId:"682183",proj:{R:75,HR:7,RBI:44,SB:23,AVG:0.269},stats2025:{R:1,HR:0,RBI:1,SB:1,AVG:0.118}},
  {id:"of076",name:"Gabriel Gonzalez",team:"MIN",pos:"OF",mlbId:"694224",proj:{R:55,HR:9,RBI:64,SB:5,AVG:0.270}},
  {id:"of077",name:"Leody Taveras",team:"BAL",pos:"OF",mlbId:"665750",proj:{R:67,HR:14,RBI:57,SB:23,AVG:0.256}},
  {id:"of078",name:"Colton Cowser",team:"BAL",pos:"OF",mlbId:"681297",proj:{R:63,HR:19,RBI:65,SB:14,AVG:0.237},stats2025:{R:36,HR:16,RBI:40,SB:14,AVG:0.196}},
  {id:"of079",name:"CJ Kayfus",team:"CLE",pos:"OF",mlbId:"692216",proj:{R:61,HR:13,RBI:64,SB:6,AVG:0.249},stats2025:{R:16,HR:4,RBI:19,SB:4,AVG:0.22}},
  {id:"of080",name:"Carson Benge",team:"NYM",pos:"OF",mlbId:"701807",proj:{R:72,HR:13,RBI:65,SB:11,AVG:0.246}},
  {id:"of081",name:"JJ Bleday",team:"CIN",pos:"OF",mlbId:"668709",proj:{R:67,HR:21,RBI:68,SB:3,AVG:0.227},stats2025:{R:48,HR:14,RBI:39,SB:1,AVG:0.212}},
  {id:"of082",name:"Brenton Doyle",team:"COL",pos:"OF",mlbId:"686668",proj:{R:64,HR:17,RBI:63,SB:18,AVG:0.250},stats2025:{R:57,HR:15,RBI:57,SB:18,AVG:0.233}},
  {id:"of083",name:"Henry Bolte",team:"ATH",pos:"OF",mlbId:"703607",proj:{R:63,HR:10,RBI:69,SB:27,AVG:0.243}},
  {id:"of084",name:"Yonathan Perlaza",team:"---",pos:"OF",mlbId:"666632",proj:{R:70,HR:15,RBI:66,SB:8,AVG:0.230}},
  {id:"of085",name:"Jack Suwinski",team:"LAD",pos:"OF",mlbId:"669261",proj:{R:56,HR:18,RBI:57,SB:12,AVG:0.229},stats2025:{R:15,HR:3,RBI:10,SB:7,AVG:0.147}},
  {id:"of086",name:"Owen Caissie",team:"MIA",pos:"OF",mlbId:"683357",proj:{R:60,HR:15,RBI:63,SB:4,AVG:0.242},stats2025:{R:4,HR:1,RBI:4,SB:0,AVG:0.192}},
  {id:"of087",name:"Brandon Marsh",team:"PHI",pos:"OF",mlbId:"669016",proj:{R:59,HR:14,RBI:59,SB:10,AVG:0.260},stats2025:{R:59,HR:11,RBI:43,SB:7,AVG:0.28}},
  {id:"of088",name:"Johnathan Rodríguez",team:"CLE",pos:"OF",mlbId:"671286",proj:{R:56,HR:17,RBI:66,SB:2,AVG:0.253},stats2025:{R:6,HR:2,RBI:10,SB:1,AVG:0.197}},
  {id:"of089",name:"Esmerlyn Valdez",team:"PIT",pos:"OF",mlbId:"699013",proj:{R:56,HR:17,RBI:69,SB:2,AVG:0.239}},
  {id:"of090",name:"James Outman",team:"MIN",pos:"OF",mlbId:"681546",proj:{R:72,HR:18,RBI:55,SB:12,AVG:0.220},stats2025:{R:19,HR:6,RBI:11,SB:1,AVG:0.134}},
  {id:"of091",name:"Josh Lowe",team:"LAA",pos:"OF",mlbId:"666139",proj:{R:59,HR:14,RBI:54,SB:21,AVG:0.257},stats2025:{R:56,HR:11,RBI:40,SB:18,AVG:0.22}},
  {id:"of092",name:"Jake McCarthy",team:"COL",pos:"OF",mlbId:"664983",proj:{R:63,HR:7,RBI:47,SB:20,AVG:0.279},stats2025:{R:18,HR:4,RBI:20,SB:6,AVG:0.204}},
  {id:"of093",name:"Jesús Sánchez",team:"TOR",pos:"OF",mlbId:"660821",proj:{R:61,HR:18,RBI:61,SB:10,AVG:0.243},stats2025:{R:61,HR:14,RBI:48,SB:13,AVG:0.237}},
  {id:"of094",name:"Wilyer Abreu",team:"BOS",pos:"OF",mlbId:"677800",proj:{R:61,HR:18,RBI:64,SB:7,AVG:0.245},stats2025:{R:53,HR:22,RBI:69,SB:6,AVG:0.247}},
  {id:"of095",name:"Zach Ehrhard",team:"LAD",pos:"OF",mlbId:"701394",proj:{R:70,HR:15,RBI:70,SB:18,AVG:0.229}},
  {id:"of096",name:"Jasson Domínguez",team:"NYY",pos:"OF",mlbId:"691176",proj:{R:66,HR:14,RBI:55,SB:23,AVG:0.249},stats2025:{R:58,HR:10,RBI:47,SB:23,AVG:0.257}},
  {id:"of097",name:"Mike Yastrzemski",team:"ATL",pos:"OF",mlbId:"573262",proj:{R:60,HR:16,RBI:49,SB:4,AVG:0.227},stats2025:{R:68,HR:17,RBI:46,SB:7,AVG:0.233}},
  {id:"of098",name:"Grant McCray",team:"SFG",pos:"OF",mlbId:"687529",proj:{R:75,HR:13,RBI:61,SB:20,AVG:0.231},stats2025:{R:3,HR:0,RBI:2,SB:0,AVG:0.091}},
  {id:"of099",name:"Daulton Varsho",team:"TOR",pos:"OF",mlbId:"662139",proj:{R:64,HR:24,RBI:71,SB:7,AVG:0.227},stats2025:{R:43,HR:20,RBI:55,SB:2,AVG:0.238}},
  {id:"of100",name:"Davis Schneider",team:"TOR",pos:"OF",mlbId:"676914",proj:{R:56,HR:18,RBI:58,SB:6,AVG:0.222},stats2025:{R:33,HR:11,RBI:31,SB:3,AVG:0.234}},
  {id:"of101",name:"Akil Baddoo",team:"MIL",pos:"OF",mlbId:"668731",proj:{R:61,HR:14,RBI:57,SB:17,AVG:0.234},stats2025:{R:0,HR:0,RBI:1,SB:1,AVG:0.118}},
  {id:"of102",name:"Luis Robert Jr.",team:"NYM",pos:"OF",mlbId:"673357",proj:{R:59,HR:18,RBI:69,SB:24,AVG:0.238},stats2025:{R:52,HR:14,RBI:53,SB:33,AVG:0.223}},
  {id:"of103",name:"Jeremiah Jackson",team:"BAL",pos:"OF",mlbId:"669236",proj:{R:55,HR:19,RBI:68,SB:8,AVG:0.242},stats2025:{R:20,HR:5,RBI:21,SB:0,AVG:0.276}},
  {id:"of104",name:"Bo Davidson",team:"SFG",pos:"OF",mlbId:"815589",proj:{R:64,HR:11,RBI:56,SB:10,AVG:0.247}},
  {id:"of105",name:"Joey Loperfido",team:"HOU",pos:"OF",mlbId:"694388",proj:{R:60,HR:15,RBI:65,SB:10,AVG:0.245},stats2025:{R:12,HR:4,RBI:14,SB:1,AVG:0.333}},
  {id:"of106",name:"Zach Cole",team:"HOU",pos:"OF",mlbId:"805904",proj:{R:59,HR:17,RBI:66,SB:14,AVG:0.219},stats2025:{R:9,HR:4,RBI:11,SB:3,AVG:0.255}},
  {id:"of107",name:"Parker Meadows",team:"DET",pos:"OF",mlbId:"678009",proj:{R:62,HR:13,RBI:58,SB:13,AVG:0.234},stats2025:{R:22,HR:4,RBI:16,SB:4,AVG:0.215}},
  {id:"of108",name:"Ramón Laureano",team:"SDP",pos:"OF",mlbId:"657656",proj:{R:59,HR:17,RBI:58,SB:7,AVG:0.242},stats2025:{R:72,HR:24,RBI:76,SB:7,AVG:0.281}},
  {id:"of109",name:"Dustin Harris",team:"CHW",pos:"OF",mlbId:"687957",proj:{R:65,HR:11,RBI:54,SB:22,AVG:0.241}},
  {id:"of110",name:"Nelson Rada",team:"LAA",pos:"OF",mlbId:"703185",proj:{R:66,HR:3,RBI:52,SB:30,AVG:0.247}},
  {id:"of111",name:"Gavin Lux",team:"TBR",pos:"OF",mlbId:"666158",proj:{R:56,HR:8,RBI:44,SB:3,AVG:0.264},stats2025:{R:49,HR:5,RBI:53,SB:1,AVG:0.269}},
  {id:"of112",name:"Ryan Vilade",team:"TBR",pos:"OF",mlbId:"668723",proj:{R:57,HR:11,RBI:57,SB:8,AVG:0.252}},
  {id:"of113",name:"Austin Hays",team:"CHW",pos:"OF",mlbId:"669720",proj:{R:60,HR:15,RBI:52,SB:6,AVG:0.251},stats2025:{R:60,HR:15,RBI:64,SB:7,AVG:0.266}},
  {id:"of114",name:"Jonatan Clase",team:"TOR",pos:"OF",mlbId:"682729",proj:{R:64,HR:12,RBI:58,SB:28,AVG:0.223},stats2025:{R:10,HR:2,RBI:9,SB:3,AVG:0.21}},
  {id:"of115",name:"Phillip Glasser",team:"WSN",pos:"OF",mlbId:"701298",proj:{R:60,HR:5,RBI:52,SB:15,AVG:0.267}},
  {id:"of116",name:"Bryan Torres",team:"STL",pos:"OF",mlbId:"663494",proj:{R:53,HR:4,RBI:43,SB:16,AVG:0.277}},
  {id:"of117",name:"Joshua Báez",team:"STL",pos:"OF",mlbId:"695491",proj:{R:55,HR:12,RBI:57,SB:24,AVG:0.234}},
  {id:"of118",name:"Cam Smith",team:"HOU",pos:"OF",mlbId:"701358",proj:{R:58,HR:11,RBI:52,SB:8,AVG:0.243},stats2025:{R:55,HR:9,RBI:51,SB:8,AVG:0.236}},
  {id:"of119",name:"Blake Dunn",team:"CIN",pos:"OF",mlbId:"694362",proj:{R:64,HR:9,RBI:54,SB:18,AVG:0.239}},
  {id:"of120",name:"Seth Stephenson",team:"DET",pos:"OF",mlbId:"700931",proj:{R:75,HR:6,RBI:62,SB:28,AVG:0.251}},
  {id:"of121",name:"Will Benson",team:"CIN",pos:"OF",mlbId:"666181",proj:{R:58,HR:16,RBI:55,SB:11,AVG:0.229},stats2025:{R:31,HR:12,RBI:41,SB:2,AVG:0.226}},
  {id:"of122",name:"Sam Hilliard",team:"---",pos:"OF",mlbId:"656541",proj:{R:55,HR:13,RBI:47,SB:10,AVG:0.239},stats2025:{R:8,HR:2,RBI:3,SB:2,AVG:0.196}},
  {id:"of123",name:"Max Kepler",team:"---",pos:"OF",mlbId:"596146",proj:{R:57,HR:17,RBI:54,SB:3,AVG:0.237},stats2025:{R:58,HR:18,RBI:52,SB:3,AVG:0.216}},
  {id:"of124",name:"Zach McKinstry",team:"DET",pos:"OF",mlbId:"656716",proj:{R:56,HR:10,RBI:43,SB:15,AVG:0.243},stats2025:{R:68,HR:12,RBI:49,SB:19,AVG:0.259}},
  {id:"of125",name:"Cedric Mullins",team:"TBR",pos:"OF",mlbId:"656775",proj:{R:59,HR:15,RBI:56,SB:20,AVG:0.224},stats2025:{R:58,HR:17,RBI:59,SB:22,AVG:0.216}},
  {id:"of126",name:"Dominic Canzone",team:"SEA",pos:"OF",mlbId:"686527",proj:{R:55,HR:17,RBI:57,SB:4,AVG:0.244},stats2025:{R:30,HR:11,RBI:32,SB:3,AVG:0.3}},
  {id:"of127",name:"Nolan Jones",team:"CLE",pos:"OF",mlbId:"666134",proj:{R:50,HR:11,RBI:47,SB:9,AVG:0.244},stats2025:{R:34,HR:5,RBI:34,SB:8,AVG:0.212}},
  {id:"of128",name:"Dylan Crews",team:"WSN",pos:"OF",mlbId:"686611",proj:{R:58,HR:12,RBI:50,SB:20,AVG:0.244},stats2025:{R:43,HR:10,RBI:27,SB:17,AVG:0.208}},
  {id:"of129",name:"Alan Roden",team:"MIN",pos:"OF",mlbId:"702176",proj:{R:57,HR:7,RBI:47,SB:7,AVG:0.260}},
  {id:"of130",name:"Andrew Pinckney",team:"WSN",pos:"OF",mlbId:"687605",proj:{R:62,HR:11,RBI:59,SB:19,AVG:0.242}},
  {id:"of131",name:"Jahmai Jones",team:"DET",pos:"OF",mlbId:"663330",proj:{R:54,HR:11,RBI:51,SB:7,AVG:0.251},stats2025:{R:21,HR:7,RBI:23,SB:2,AVG:0.287}},
  {id:"of132",name:"RJ Schreck",team:"TOR",pos:"OF",mlbId:"702302",proj:{R:54,HR:17,RBI:61,SB:4,AVG:0.217}},
  {id:"of133",name:"Drew Gilbert",team:"SFG",pos:"OF",mlbId:"687551",proj:{R:52,HR:12,RBI:57,SB:5,AVG:0.230},stats2025:{R:12,HR:3,RBI:13,SB:1,AVG:0.19}},
  {id:"of134",name:"Nate Eaton",team:"BOS",pos:"OF",mlbId:"681987",proj:{R:59,HR:10,RBI:54,SB:18,AVG:0.246},stats2025:{R:16,HR:1,RBI:4,SB:9,AVG:0.296}},
  {id:"of135",name:"Pedro León",team:"PHI",pos:"OF",mlbId:"694175",proj:{R:60,HR:16,RBI:67,SB:16,AVG:0.222}},
  {id:"of136",name:"Harrison Bader",team:"SFG",pos:"OF",mlbId:"664056",proj:{R:56,HR:13,RBI:49,SB:13,AVG:0.254},stats2025:{R:61,HR:17,RBI:54,SB:11,AVG:0.277}},
  {id:"of137",name:"Masataka Yoshida",team:"BOS",pos:"OF",mlbId:"807799",proj:{R:42,HR:9,RBI:49,SB:4,AVG:0.278},stats2025:{R:16,HR:4,RBI:26,SB:3,AVG:0.266}},
  {id:"of138",name:"Austin Overn",team:"TBR",pos:"OF",mlbId:"702556",proj:{R:63,HR:11,RBI:50,SB:31,AVG:0.232}},
  {id:"of139",name:"Rhylan Thomas",team:"SEA",pos:"OF",mlbId:"689041",proj:{R:67,HR:4,RBI:49,SB:17,AVG:0.260},stats2025:{R:2,HR:0,RBI:2,SB:0,AVG:0.125}},
  {id:"of140",name:"Tyler Black",team:"MIL",pos:"OF",mlbId:"672012",proj:{R:54,HR:9,RBI:50,SB:18,AVG:0.224},stats2025:{R:1,HR:0,RBI:1,SB:0,AVG:0.25}},
  {id:"of141",name:"Homer Bush Jr.",team:"TBR",pos:"OF",mlbId:"683344",proj:{R:60,HR:3,RBI:48,SB:29,AVG:0.259}},
  {id:"of142",name:"Carson Roccaforte",team:"KCR",pos:"OF",mlbId:"811287",proj:{R:60,HR:12,RBI:55,SB:19,AVG:0.206}},
  {id:"of143",name:"Isaac Collins",team:"KCR",pos:"OF",mlbId:"686555",proj:{R:56,HR:9,RBI:50,SB:15,AVG:0.229},stats2025:{R:56,HR:9,RBI:54,SB:16,AVG:0.263}},
  {id:"of144",name:"Jake Mangum",team:"PIT",pos:"OF",mlbId:"663968",proj:{R:44,HR:3,RBI:42,SB:17,AVG:0.285},stats2025:{R:37,HR:3,RBI:40,SB:27,AVG:0.296}},
  {id:"of145",name:"Victor Scott II",team:"STL",pos:"OF",mlbId:"687363",proj:{R:60,HR:7,RBI:43,SB:36,AVG:0.226},stats2025:{R:54,HR:5,RBI:37,SB:34,AVG:0.216}},
  {id:"of146",name:"Everson Pereira",team:"CHW",pos:"OF",mlbId:"677592",proj:{R:62,HR:16,RBI:50,SB:9,AVG:0.234},stats2025:{R:7,HR:2,RBI:8,SB:2,AVG:0.138}},
  {id:"of147",name:"Alex Call",team:"LAD",pos:"OF",mlbId:"669743",proj:{R:49,HR:11,RBI:48,SB:6,AVG:0.243},stats2025:{R:43,HR:5,RBI:31,SB:2,AVG:0.267}},
  {id:"of148",name:"Evan Carter",team:"TEX",pos:"OF",mlbId:"694497",proj:{R:54,HR:9,RBI:43,SB:18,AVG:0.236},stats2025:{R:31,HR:5,RBI:25,SB:14,AVG:0.247}},
  {id:"of149",name:"Javier Sanoja",team:"MIA",pos:"OF",mlbId:"691594",proj:{R:52,HR:6,RBI:52,SB:10,AVG:0.252},stats2025:{R:40,HR:6,RBI:38,SB:6,AVG:0.243}},
  {id:"of150",name:"Tirso Ornelas",team:"SDP",pos:"OF",mlbId:"672359",proj:{R:52,HR:10,RBI:49,SB:5,AVG:0.239},stats2025:{R:0,HR:0,RBI:1,SB:0,AVG:0.071}},
  {id:"of151",name:"Tyler O\'Neill",team:"BAL",pos:"OF",mlbId:"641933",proj:{R:47,HR:18,RBI:49,SB:5,AVG:0.238},stats2025:{R:22,HR:9,RBI:26,SB:4,AVG:0.199}},
  {id:"of152",name:"Nathan Lukes",team:"TOR",pos:"OF",mlbId:"664770",proj:{R:48,HR:9,RBI:49,SB:3,AVG:0.268},stats2025:{R:55,HR:12,RBI:65,SB:2,AVG:0.255}},
  {id:"of153",name:"Kameron Misner",team:"KCR",pos:"OF",mlbId:"670224",proj:{R:54,HR:11,RBI:46,SB:16,AVG:0.210},stats2025:{R:27,HR:5,RBI:22,SB:8,AVG:0.213}},
  {id:"of154",name:"Drew Waters",team:"KCR",pos:"OF",mlbId:"671221",proj:{R:55,HR:9,RBI:45,SB:12,AVG:0.224},stats2025:{R:21,HR:1,RBI:14,SB:5,AVG:0.243}},
  {id:"of155",name:"Alejandro Osuna",team:"TEX",pos:"OF",mlbId:"696030",proj:{R:52,HR:7,RBI:45,SB:13,AVG:0.242}},
  {id:"of156",name:"Dominic Fletcher",team:"PIT",pos:"OF",mlbId:"666150",proj:{R:48,HR:8,RBI:47,SB:4,AVG:0.246},stats2025:{R:5,HR:1,RBI:2,SB:1,AVG:0.219}},
  {id:"of157",name:"Kole Myers",team:"LAD",pos:"OF",mlbId:"801887",proj:{R:60,HR:4,RBI:44,SB:19,AVG:0.239}},
  {id:"of158",name:"Ricardo Olivar",team:"MIN",pos:"OF",mlbId:"691627",proj:{R:49,HR:9,RBI:46,SB:5,AVG:0.239}},
  {id:"of159",name:"Jacob Young",team:"WSN",pos:"OF",mlbId:"696285",proj:{R:61,HR:3,RBI:42,SB:23,AVG:0.249},stats2025:{R:34,HR:2,RBI:31,SB:15,AVG:0.231}},
  {id:"of160",name:"Carlos Cortes",team:"ATH",pos:"OF",mlbId:"666126",proj:{R:46,HR:12,RBI:48,SB:1,AVG:0.238},stats2025:{R:11,HR:4,RBI:14,SB:0,AVG:0.309}},
  {id:"of161",name:"Daz Cameron",team:"MIL",pos:"OF",mlbId:"663662",proj:{R:49,HR:13,RBI:51,SB:12,AVG:0.233},stats2025:{R:7,HR:1,RBI:3,SB:1,AVG:0.195}},
  {id:"of162",name:"Jake Meyers",team:"HOU",pos:"OF",mlbId:"676694",proj:{R:48,HR:8,RBI:37,SB:10,AVG:0.249},stats2025:{R:53,HR:3,RBI:24,SB:16,AVG:0.292}},
  {id:"of163",name:"Jud Fabian",team:"BAL",pos:"OF",mlbId:"682983",proj:{R:53,HR:16,RBI:52,SB:8,AVG:0.190}},
  {id:"of164",name:"Daniel Schneemann",team:"CLE",pos:"OF",mlbId:"682177",proj:{R:50,HR:11,RBI:43,SB:8,AVG:0.222},stats2025:{R:48,HR:12,RBI:41,SB:9,AVG:0.206}},
  {id:"of165",name:"Ji Hwan Bae",team:"NYM",pos:"OF",mlbId:"678225",proj:{R:63,HR:4,RBI:42,SB:20,AVG:0.254},stats2025:{R:4,HR:0,RBI:0,SB:4,AVG:0.05}},
  {id:"of166",name:"Jesse Winker",team:"---",pos:"OF",mlbId:"608385",proj:{R:39,HR:9,RBI:39,SB:4,AVG:0.235},stats2025:{R:8,HR:1,RBI:10,SB:1,AVG:0.229}},
  {id:"of167",name:"Andrew Stevenson",team:"---",pos:"OF",mlbId:"664057",proj:{R:43,HR:7,RBI:43,SB:19,AVG:0.260},stats2025:{R:8,HR:0,RBI:2,SB:2,AVG:0.217}},
  {id:"of168",name:"Taylor Trammell",team:"HOU",pos:"OF",mlbId:"666211",proj:{R:45,HR:13,RBI:43,SB:9,AVG:0.222},stats2025:{R:15,HR:3,RBI:12,SB:3,AVG:0.197}},
  {id:"of169",name:"Braiden Ward",team:"BOS",pos:"OF",mlbId:"685274",proj:{R:60,HR:3,RBI:49,SB:33,AVG:0.246}},
  {id:"of170",name:"DaShawn Keirsey Jr.",team:"ATL",pos:"OF",mlbId:"680577",proj:{R:48,HR:7,RBI:44,SB:23,AVG:0.238}},
  {id:"of171",name:"Carlos Mendoza",team:"TOR",pos:"OF",mlbId:"685332",proj:{R:58,HR:5,RBI:47,SB:9,AVG:0.237}},
  {id:"of172",name:"Jerar Encarnacion",team:"SFG",pos:"OF",mlbId:"666464",proj:{R:41,HR:14,RBI:53,SB:3,AVG:0.246},stats2025:{R:5,HR:2,RBI:7,SB:1,AVG:0.2}},
  {id:"of173",name:"Matt Gorski",team:"LAD",pos:"OF",mlbId:"685301",proj:{R:48,HR:18,RBI:67,SB:8,AVG:0.227},stats2025:{R:2,HR:2,RBI:4,SB:0,AVG:0.195}},
  {id:"of174",name:"José Caballero",team:"NYY",pos:"OF",mlbId:"676609",proj:{R:49,HR:7,RBI:38,SB:40,AVG:0.217},stats2025:{R:52,HR:5,RBI:36,SB:49,AVG:0.236}},
  {id:"of175",name:"Johan Rojas",team:"PHI",pos:"OF",mlbId:"679032",proj:{R:54,HR:5,RBI:41,SB:24,AVG:0.247},stats2025:{R:23,HR:1,RBI:18,SB:12,AVG:0.224}},
  {id:"of176",name:"Denzel Clarke",team:"ATH",pos:"OF",mlbId:"672016",proj:{R:48,HR:8,RBI:43,SB:13,AVG:0.231},stats2025:{R:18,HR:3,RBI:8,SB:6,AVG:0.23}},
  {id:"of177",name:"Jared Oliva",team:"SFG",pos:"OF",mlbId:"666931",proj:{R:51,HR:8,RBI:42,SB:25,AVG:0.240}},
  {id:"of178",name:"Henry Davis",team:"PIT",pos:"OF",mlbId:"680779",proj:{R:42,HR:11,RBI:41,SB:5,AVG:0.225},stats2025:{R:25,HR:7,RBI:22,SB:2,AVG:0.167}},
  {id:"of179",name:"Dylan Carlson",team:"CHC",pos:"OF",mlbId:"666185",proj:{R:41,HR:8,RBI:38,SB:5,AVG:0.229},stats2025:{R:17,HR:6,RBI:20,SB:3,AVG:0.203}},
  {id:"of180",name:"Emmanuel Rodriguez",team:"MIN",pos:"OF",mlbId:"691181",proj:{R:47,HR:7,RBI:34,SB:7,AVG:0.224}},
  {id:"of181",name:"Bligh Madris",team:"STL",pos:"OF",mlbId:"676632",proj:{R:45,HR:11,RBI:45,SB:6,AVG:0.216}},
  {id:"of182",name:"Kellen Strahm",team:"HOU",pos:"OF",mlbId:"687005",proj:{R:50,HR:6,RBI:36,SB:15,AVG:0.224}},
  {id:"of183",name:"Austin Martin",team:"MIN",pos:"OF",mlbId:"668885",proj:{R:42,HR:3,RBI:30,SB:13,AVG:0.251},stats2025:{R:22,HR:1,RBI:7,SB:11,AVG:0.282}},
  {id:"of184",name:"Conner Capel",team:"COL",pos:"OF",mlbId:"668843",proj:{R:39,HR:9,RBI:41,SB:13,AVG:0.221}},
  {id:"of185",name:"Victor Mesa Jr.",team:"TBR",pos:"OF",mlbId:"683748",proj:{R:42,HR:9,RBI:45,SB:5,AVG:0.228},stats2025:{R:7,HR:1,RBI:6,SB:0,AVG:0.188}},
  {id:"of186",name:"Brandon Lockridge",team:"MIL",pos:"OF",mlbId:"663604",proj:{R:43,HR:3,RBI:34,SB:21,AVG:0.248},stats2025:{R:17,HR:0,RBI:11,SB:10,AVG:0.231}},
  {id:"of187",name:"Myles Straw",team:"TOR",pos:"OF",mlbId:"664702",proj:{R:53,HR:4,RBI:32,SB:15,AVG:0.236},stats2025:{R:51,HR:4,RBI:32,SB:12,AVG:0.262}},
  {id:"of188",name:"Tyler Callihan",team:"PIT",pos:"OF",mlbId:"682997",proj:{R:38,HR:8,RBI:40,SB:11,AVG:0.229},stats2025:{R:0,HR:0,RBI:1,SB:0,AVG:0.167}},
  {id:"of189",name:"Kyle Isbel",team:"KCR",pos:"OF",mlbId:"664728",proj:{R:49,HR:6,RBI:37,SB:7,AVG:0.237},stats2025:{R:42,HR:4,RBI:33,SB:4,AVG:0.255}},
  {id:"of190",name:"Brett Bateman",team:"CHC",pos:"OF",mlbId:"703520",proj:{R:45,HR:3,RBI:31,SB:12,AVG:0.227}},
  {id:"of191",name:"José Barrero",team:"BAL",pos:"OF",mlbId:"676480",proj:{R:40,HR:13,RBI:47,SB:10,AVG:0.206},stats2025:{R:4,HR:1,RBI:3,SB:0,AVG:0.138}},
  {id:"of192",name:"Steward Berroa",team:"MIL",pos:"OF",mlbId:"672642",proj:{R:50,HR:5,RBI:35,SB:25,AVG:0.214}},
  {id:"of193",name:"Jack Dunn",team:"---",pos:"OF",mlbId:"686639",proj:{R:42,HR:4,RBI:37,SB:10,AVG:0.221}},
  {id:"of194",name:"Gilberto Celestino",team:"TEX",pos:"OF",mlbId:"665482",proj:{R:42,HR:4,RBI:35,SB:6,AVG:0.236}},
  {id:"of195",name:"Chas McCormick",team:"CHC",pos:"OF",mlbId:"676801",proj:{R:39,HR:9,RBI:37,SB:10,AVG:0.227},stats2025:{R:13,HR:1,RBI:5,SB:2,AVG:0.21}},
  {id:"of196",name:"Blake Perkins",team:"MIL",pos:"OF",mlbId:"663368",proj:{R:43,HR:6,RBI:34,SB:12,AVG:0.222},stats2025:{R:25,HR:3,RBI:19,SB:7,AVG:0.226}},
  {id:"of197",name:"Jose Siri",team:"LAA",pos:"OF",mlbId:"642350",proj:{R:49,HR:13,RBI:44,SB:12,AVG:0.199},stats2025:{R:7,HR:0,RBI:1,SB:2,AVG:0.063}},
  {id:"of198",name:"Derek Hill",team:"CHW",pos:"OF",mlbId:"656537",proj:{R:42,HR:8,RBI:35,SB:11,AVG:0.233},stats2025:{R:19,HR:3,RBI:11,SB:7,AVG:0.216}},
  {id:"of199",name:"Eli White",team:"ATL",pos:"OF",mlbId:"642201",proj:{R:44,HR:8,RBI:35,SB:13,AVG:0.240},stats2025:{R:43,HR:10,RBI:35,SB:10,AVG:0.234}},
  {id:"of200",name:"Miles Mastrobuoni",team:"SEA",pos:"OF",mlbId:"670156",proj:{R:41,HR:3,RBI:28,SB:12,AVG:0.234},stats2025:{R:20,HR:1,RBI:12,SB:6,AVG:0.25}},
  {id:"of201",name:"Michael A. Taylor",team:"---",pos:"OF",mlbId:"572191",proj:{R:36,HR:9,RBI:31,SB:9,AVG:0.206},stats2025:{R:33,HR:9,RBI:35,SB:8,AVG:0.2}},
  {id:"of202",name:"Jorge Mateo",team:"ATL",pos:"OF",mlbId:"622761",proj:{R:36,HR:6,RBI:28,SB:23,AVG:0.222},stats2025:{R:9,HR:1,RBI:3,SB:15,AVG:0.177}},
  {id:"of203",name:"Greg Allen",team:"---",pos:"OF",mlbId:"656185",proj:{R:29,HR:4,RBI:27,SB:10,AVG:0.221}},
].sort((a,b) => pts(b.proj) - pts(a.proj));

const DH_POOL = [
  {id:"dh001",name:"Shohei Ohtani",       team:"LAD",pos:"DH",mlbId:"660271",proj:{R:138,HR:52,RBI:138,SB:29,AVG:.289},stats2025:{R:146,HR:55,RBI:102,SB:20,AVG:0.282}},
  {id:"dh002",name:"Yordan Alvarez",       team:"HOU",pos:"DH",mlbId:"670541",proj:{R:64, HR:24,RBI:72, SB:2, AVG:.289},stats2025:{R:17,HR:6,RBI:27,SB:1,AVG:0.273}},
  {id:"dh003",name:"Vinnie Pasquantino",   team:"KCR",pos:"DH",mlbId:"686469",proj:{R:63, HR:26,RBI:90, SB:1, AVG:.253},stats2025:{R:72,HR:32,RBI:113,SB:1,AVG:0.264}},
  {id:"dh004",name:"Christian Yelich",     team:"MIL",pos:"DH",mlbId:"592885",proj:{R:76, HR:17,RBI:72, SB:16,AVG:.254},stats2025:{R:88,HR:29,RBI:103,SB:16,AVG:0.264}},
  {id:"dh005",name:"Kerry Carpenter",      team:"DET",pos:"DH",mlbId:"681481",proj:{R:60, HR:24,RBI:81, SB:2, AVG:.262},stats2025:{R:66,HR:26,RBI:62,SB:1,AVG:0.252}},
  {id:"dh006",name:"Mark Vientos",         team:"NYM",pos:"DH",mlbId:"668901",proj:{R:59, HR:22,RBI:77, SB:1, AVG:.252},stats2025:{R:44,HR:17,RBI:61,SB:1,AVG:0.233}},
  {id:"dh007",name:"Marcell Ozuna",        team:"PIT",pos:"DH",mlbId:"542303",proj:{R:66, HR:25,RBI:76, SB:0, AVG:.248},stats2025:{R:61,HR:21,RBI:68,SB:0,AVG:0.232}},
  {id:"dh008",name:"Alec Burleson",        team:"STL",pos:"DH",mlbId:"676475",proj:{R:58, HR:18,RBI:68, SB:5, AVG:.274},stats2025:{R:54,HR:18,RBI:69,SB:5,AVG:0.29}},
  {id:"dh009",name:"Anthony Santander",    team:"TOR",pos:"DH",mlbId:"623993",proj:{R:59, HR:27,RBI:78, SB:1, AVG:.228},stats2025:{R:16,HR:6,RBI:18,SB:0,AVG:0.175}},
  {id:"dh010",name:"Jorge Soler",          team:"LAA",pos:"DH",mlbId:"624585",proj:{R:50, HR:18,RBI:52, SB:0, AVG:.224},stats2025:{R:31,HR:12,RBI:34,SB:0,AVG:0.215}},
  {id:"dh011",name:"Giancarlo Stanton",    team:"NYY",pos:"DH",mlbId:"519317",proj:{R:36, HR:20,RBI:57, SB:0, AVG:.220},stats2025:{R:36,HR:24,RBI:66,SB:0,AVG:0.273}},
  {id:"dh012",name:"Masataka Yoshida",     team:"BOS",pos:"DH",mlbId:"807799",proj:{R:42, HR:9, RBI:49, SB:4, AVG:.278},stats2025:{R:16,HR:4,RBI:26,SB:3,AVG:0.266}},
  {id:"dh013",name:"Eloy Jimenez",         team:"TOR",pos:"DH",mlbId:"650391",proj:{R:30, HR:10,RBI:43, SB:1, AVG:.242}},
  {id:"dh014",name:"Joc Pederson",         team:"TEX",pos:"DH",mlbId:"592626",proj:{R:44, HR:15,RBI:42, SB:2, AVG:.232},stats2025:{R:28,HR:9,RBI:26,SB:2,AVG:0.181}},
].sort((a,b) => pts(b.proj) - pts(a.proj));


function buildDeduplicatedPool(allPools) {
  const byName = new Map();
  allPools.forEach(({pool, pos}) => {
    pool.forEach(p => {
      const key = p.name.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (!byName.has(key)) {
        byName.set(key, { ...p, pos, eligPos: p.eligPos ? p.eligPos : [pos] });
      } else {
        const ex = byName.get(key);
        const rosterPos = pos === "DH" ? "OF" : pos;
        if (!ex.eligPos.includes(rosterPos)) ex.eligPos.push(rosterPos);
        if (pts(p.proj) > pts(ex.proj)) { ex.proj = p.proj; ex.team = p.team || ex.team; }
        if (p.stats2025 && !ex.stats2025) ex.stats2025 = p.stats2025;
      }
    });
  });
  const pool = [];
  byName.forEach(p => {
    const primary = p.eligPos.length === 1 ? p.eligPos[0]
      : (p.eligPos.find(pos => pos !== "DH") || "DH");
    pool.push({ ...p, pos: primary });
  });
  return pool.sort((a, b) => pts(b.proj) - pts(a.proj));
}

const SAMPLE_POOL = buildDeduplicatedPool([
  { pool: CATCHER_POOL,    pos: "C"  },
  { pool: FIRSTBASE_POOL,  pos: "1B" },
  { pool: SECONDBASE_POOL, pos: "2B" },
  { pool: THIRDBASE_POOL,  pos: "3B" },
  { pool: SHORTSTOP_POOL,  pos: "SS" },
  { pool: OUTFIELD_POOL,   pos: "OF" },
  { pool: DH_POOL,         pos: "DH" },
]);

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{-webkit-text-size-adjust:100%}
:root{
  --bg:#0a1a0f;
  --surface:#0f2216;
  --card:#132b1a;
  --card-hover:#1a3622;
  --border:#1f4028;
  --border-subtle:#172f1e;
  --accent:#3ddc6e;
  --accent-dim:rgba(61,220,110,.12);
  --accent-border:rgba(61,220,110,.35);
  --green:#3ddc6e;
  --green-dim:rgba(61,220,110,.1);
  --green-border:rgba(61,220,110,.3);
  --green-bright:#5eff8a;
  --amber:#f5c842;
  --amber-dim:rgba(245,200,66,.08);
  --amber-border:rgba(245,200,66,.3);
  --red:#ff5f5f;
  --text:#ffffff;
  --text-secondary:#a8d4b4;
  --text-muted:#4d8060;
  --font:'Inter',system-ui,sans-serif;
  --radius:10px;
  --radius-lg:14px;
}
body{background:var(--bg);color:var(--text);font-family:var(--font);-webkit-font-smoothing:antialiased;overflow-x:hidden;width:100%}
.app{min-height:100vh;width:100%;overflow-x:hidden}

/* NAV */
.nav{display:flex;align-items:center;gap:8px;padding:0 14px;height:54px;
  border-bottom:1px solid var(--border);
  background:rgba(10,26,15,.95);backdrop-filter:blur(20px);
  position:sticky;top:0;z-index:100;width:100%;overflow:hidden}
.nav-logo{font-size:17px;font-weight:800;color:var(--text);letter-spacing:-.5px;white-space:nowrap}
.nav-logo span{color:var(--green)}
.nav-sub{display:none}
.nav-spacer{flex:1;min-width:0}
.nav-mode{font-size:11px;font-weight:700;padding:4px 10px;border-radius:20px;letter-spacing:.3px;text-transform:uppercase;white-space:nowrap}
.nav-mode.setup{background:var(--amber-dim);color:var(--amber);border:1px solid var(--amber-border)}
.nav-mode.draft{background:var(--green-dim);color:var(--accent);border:1px solid var(--green-border)}
.nav-mode.season{background:var(--green-dim);color:var(--green);border:1px solid var(--green-border)}
.pool-badge{font-size:11px;font-weight:600;padding:4px 10px;border-radius:20px;
  background:var(--green-dim);border:1px solid var(--green-border);color:var(--green);
  display:flex;align-items:center;gap:5px;white-space:nowrap}
.pool-badge .dot{width:6px;height:6px;border-radius:50%;background:var(--green);flex-shrink:0;animation:blink 2s ease infinite}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.2}}
@keyframes your-turn-pulse{0%,100%{box-shadow:0 0 0 0 rgba(61,220,110,.4)}60%{box-shadow:0 0 0 12px rgba(61,220,110,0)}}

/* PAGE */
.page{width:100%;max-width:100%;padding:16px 14px;overflow-x:hidden}
.section-title{font-size:24px;font-weight:800;color:var(--text);letter-spacing:-.5px;margin-bottom:2px}
.section-sub{font-size:13px;color:var(--text-muted);margin-bottom:18px;letter-spacing:.1px;display:flex;flex-wrap:wrap;align-items:center;gap:6px}

/* CARDS */
.card{background:var(--card);border:1px solid var(--border);border-radius:var(--radius-lg);padding:16px;width:100%}
.card-title{font-size:11px;font-weight:700;color:var(--text-muted);letter-spacing:1px;text-transform:uppercase;margin-bottom:12px}

/* BUTTONS */
.btn{font-size:13px;font-weight:700;padding:10px 18px;border-radius:var(--radius);border:none;cursor:pointer;letter-spacing:.2px;text-transform:uppercase;transition:all .14s;white-space:nowrap;-webkit-tap-highlight-color:transparent}
.btn-primary{background:var(--green);color:#000}
.btn-primary:active{background:var(--green-bright)}
.btn-secondary{background:transparent;border:1px solid var(--border);color:var(--text-secondary)}
.btn-secondary:active{border-color:var(--green);color:var(--green);background:var(--green-dim)}
.btn-danger{background:rgba(255,95,95,.1);border:1px solid rgba(255,95,95,.3);color:var(--red)}
.btn-success{background:var(--green);color:#000;font-weight:800}
.btn:disabled{opacity:.3;cursor:not-allowed}
.btn-sm{padding:6px 12px;font-size:12px}

/* INPUTS */
.input{background:var(--surface);border:1px solid var(--border);color:var(--text);
  padding:12px 14px;border-radius:var(--radius);font-family:var(--font);font-size:16px;
  outline:none;width:100%;transition:border-color .14s;-webkit-appearance:none}
.input:focus{border-color:var(--green);box-shadow:0 0 0 3px rgba(61,220,110,.1)}
.input::placeholder{color:var(--text-muted)}
label{font-size:12px;font-weight:600;color:var(--text-secondary);text-transform:uppercase;letter-spacing:.8px;display:block;margin-bottom:6px}

/* UTILITIES */
.grid-2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.flex{display:flex}.gap-8{gap:8px}.gap-12{gap:12px}
.items-center{align-items:center}.justify-between{justify-content:space-between}
.mt-8{margin-top:8px}.mt-16{margin-top:16px}

/* BADGES */
.badge{display:inline-block;font-size:10px;font-weight:700;padding:3px 6px;border-radius:5px;letter-spacing:.3px;text-transform:uppercase;white-space:nowrap}
.badge-C   {background:rgba(245,200,66,.15); color:var(--amber);    border:1px solid rgba(245,200,66,.3)}
.badge-1B  {background:rgba(61,220,110,.15); color:var(--green);    border:1px solid rgba(61,220,110,.3)}
.badge-2B  {background:rgba(139,92,246,.15); color:#c4b5fd;         border:1px solid rgba(139,92,246,.3)}
.badge-3B  {background:rgba(236,72,153,.15); color:#f9a8d4;         border:1px solid rgba(236,72,153,.3)}
.badge-SS  {background:rgba(56,189,248,.15); color:#7dd3fc;         border:1px solid rgba(56,189,248,.3)}
.badge-OF  {background:rgba(251,113,133,.15);color:#fda4af;         border:1px solid rgba(251,113,133,.3)}
.badge-DH  {background:rgba(45,212,191,.15); color:#5eead4;         border:1px solid rgba(45,212,191,.3)}
.badge-UTIL{background:rgba(99,102,241,.15); color:#a5b4fc;         border:1px solid rgba(99,102,241,.3)}

/* PLAYER ROWS */
.player-row{display:grid;align-items:center;
  grid-template-columns:30px 38px 1fr 56px 72px;
  gap:6px;padding:10px 10px;border-radius:var(--radius);border:1px solid transparent;
  transition:background .1s;cursor:pointer;width:100%;min-width:0}
.player-row:active{background:var(--card-hover)}
.player-row.drafted{opacity:.18;pointer-events:none}
.player-row.not-your-turn{cursor:default}
.player-row-header{pointer-events:none;opacity:.4}
.rank-num{font-size:12px;font-weight:600;color:var(--text-muted);text-align:right}
.pts-val{font-size:14px;font-weight:700;color:var(--green);text-align:right}
.player-name{font-size:15px;font-weight:600;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.player-team{font-size:11px;color:var(--text-muted);margin-top:1px}

/* DRAFT LAYOUT - single column on mobile */
.draft-layout{display:grid;grid-template-columns:1fr;gap:16px}

/* CLOCK */
.clock-banner{background:var(--card);border:1px solid var(--border);
  border-radius:var(--radius-lg);padding:14px 16px;margin-bottom:14px;
  display:flex;align-items:center;justify-content:space-between;width:100%}
.clock-team{font-size:20px;font-weight:800;color:var(--text);letter-spacing:-.4px}
.clock-info{font-size:12px;color:var(--text-muted);margin-top:3px}

/* ROSTER */
.roster-mini{background:var(--card);border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden;margin-bottom:12px;width:100%}
.roster-mini-header{padding:11px 14px;background:var(--surface);font-size:12px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;color:var(--text-secondary);display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--border-subtle)}
.roster-mini-row{padding:9px 14px;border-top:1px solid var(--border-subtle);display:flex;align-items:center;gap:8px}

/* TABS */
.tabs{display:flex;gap:2px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:3px;margin-bottom:16px;width:100%}
.tab{flex:1;padding:9px 6px;border-radius:8px;cursor:pointer;font-size:12px;font-weight:700;letter-spacing:.3px;text-transform:uppercase;color:var(--text-muted);border:none;background:none;transition:all .14s;text-align:center;-webkit-tap-highlight-color:transparent}
.tab.active{background:var(--card);color:var(--green);box-shadow:0 1px 4px rgba(0,0,0,.4)}

/* STANDINGS */
.standings-row{display:grid;grid-template-columns:28px 1fr 80px 40px;gap:6px;align-items:center;padding:13px 14px;border-bottom:1px solid var(--border-subtle)}
.standings-row:last-child{border-bottom:none}
.standings-row.header{background:var(--surface);font-size:11px;font-weight:700;color:var(--text-muted);letter-spacing:.8px;text-transform:uppercase}

/* PERIOD PILLS */
.period-pill{font-size:12px;font-weight:700;padding:6px 12px;border-radius:20px;cursor:pointer;border:1px solid var(--border);background:transparent;color:var(--text-muted);text-transform:uppercase;transition:all .14s;-webkit-tap-highlight-color:transparent}
.period-pill.active{background:var(--green-dim);color:var(--green);border-color:var(--green-border)}

/* SEARCH */
.search-bar{position:relative;width:100%}
.search-bar .input{padding-left:38px;font-size:16px}
.search-icon{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--text-muted);font-size:16px}

/* FILTERS */
.filter-row{display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-bottom:10px;width:100%}
.pos-filter{font-size:12px;font-weight:700;padding:7px 12px;border-radius:20px;cursor:pointer;border:1px solid var(--border);background:transparent;color:var(--text-muted);text-transform:uppercase;transition:all .12s;-webkit-tap-highlight-color:transparent;white-space:nowrap}
.pos-filter.active{border-color:var(--green);color:var(--green);background:var(--green-dim)}

/* SETUP */
.pos-chip{display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:600;padding:4px 9px;border-radius:20px;border:1px solid var(--border);color:var(--text-muted)}
.pos-chip.real{border-color:var(--green-border);color:var(--green);background:var(--green-dim)}
.setup-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;width:100%}
.team-setup-card{background:var(--card);border:1px solid var(--border);border-radius:var(--radius-lg);padding:14px;display:flex;flex-direction:column;gap:8px}
.team-num{font-size:11px;font-weight:700;color:var(--green);letter-spacing:.8px;text-transform:uppercase}
.order-list{display:flex;flex-direction:column;gap:6px;width:100%}
.order-item{display:flex;align-items:center;gap:12px;padding:12px 14px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius)}
.order-num{font-size:15px;font-weight:700;color:var(--text-muted);min-width:22px}
.order-btn{font-size:16px;padding:4px 10px;border-radius:6px;border:1px solid var(--border);background:none;color:var(--text-muted);cursor:pointer;-webkit-tap-highlight-color:transparent}
.order-btn:active{border-color:var(--green);color:var(--green)}

/* PICK LOG */
.pick-log{max-height:240px;overflow-y:auto;-webkit-overflow-scrolling:touch}
.pick-log-row{display:flex;align-items:center;justify-content:space-between;padding:9px 14px;border-bottom:1px solid var(--border-subtle);font-size:14px}
.pick-log-num{font-size:11px;color:var(--text-muted);min-width:30px;font-weight:600}
.pick-log-team{font-size:12px;font-weight:700;color:var(--green);min-width:60px}

/* TOAST */
.toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:var(--card);border:1px solid var(--border);color:var(--text);padding:12px 22px;border-radius:var(--radius);font-size:14px;font-weight:600;z-index:999;box-shadow:0 8px 32px rgba(0,0,0,.7);animation:slide-up .17s ease;white-space:nowrap;max-width:90vw}
.toast.success{border-color:var(--green-border);color:var(--green)}
.toast.error{border-color:rgba(255,95,95,.4);color:var(--red)}
@keyframes slide-up{from{opacity:0;transform:translateX(-50%) translateY(12px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}

/* DRAFT COMPLETE */
.draft-complete{text-align:center;padding:48px 20px;border:1px solid var(--green-border);border-radius:var(--radius-lg);background:var(--green-dim);margin-bottom:20px;width:100%}
.draft-complete h2{font-size:32px;font-weight:800;color:var(--green);letter-spacing:-.5px}
.draft-complete p{color:var(--text-muted);font-size:13px;margin-top:8px}

/* SCROLLBAR */
::-webkit-scrollbar{width:3px;height:3px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:var(--border);border-radius:3px}

/* DESKTOP ENHANCEMENTS */
@media(min-width:640px){
  .page{padding:24px 20px}
  .draft-layout{grid-template-columns:1fr 300px}
  .setup-grid{grid-template-columns:repeat(3,1fr)}
  .nav-sub{display:block}
  .section-title{font-size:28px}
}`;

// ── Utility components ──────────────────────────────────────────────────────

function Toast({ msg, type, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 2400); return () => clearTimeout(t); }, []);
  return <div className={"toast " + type}>{msg}</div>;
}

function PosBadge({ pos }) {
  return <span className={"badge badge-" + pos}>{pos}</span>;
}

function PlayerRowHeader({ statMode }) {
  return (
    <div className="player-row player-row-header" style={{color:"var(--text-muted)",fontSize:10,letterSpacing:1}}>
      <span className="rank-num">#</span>
      <span></span>
      <span>PLAYER</span>
      <span className="pts-val" style={{color:statMode==="2025"?"var(--amber)":"var(--green)"}}>
        {statMode==="2025" ? "2025" : "PROJ"}
      </span>
      <span></span>
    </div>
  );
}

function PlayerRow({ player, rank, drafted, onPick, onInfo, notYourTurn, slotsFull, statMode }) {
  statMode = statMode || "proj";
  var score = playerScore(player, statMode);
  var has2025 = !!player.stats2025;
  var extraPos = (player.eligPos || []).filter(function(ep){ return ep !== player.pos; });
  var rowStyle = {};
  if (slotsFull) rowStyle.opacity = 0.28;
  return (
    <div
      className={"player-row" + (drafted ? " drafted" : "") + (notYourTurn ? " not-your-turn" : "")}
      style={rowStyle}
      onClick={onInfo ? function(e){ e.stopPropagation(); onInfo(); } : undefined}
    >
      <span className="rank-num">{rank}</span>
      <PosBadge pos={player.pos} />
      <div>
        <div className="player-name" style={{display:"flex",alignItems:"center",gap:4,flexWrap:"wrap"}}>
          {player.name}
          {extraPos.map(function(ep){
            return (
              <span key={ep} style={{fontSize:8,padding:"1px 3px",borderRadius:3,background:"rgba(255,255,255,.06)",color:"var(--text-muted)",border:"1px solid var(--border)"}}>
                {ep}
              </span>
            );
          })}
        </div>
        <div className="player-team">
          {player.team}
          {statMode === "2025" && !has2025 && (
            <span style={{fontSize:9,color:"var(--text-muted)",marginLeft:5}}>no 2025</span>
          )}
        </div>
      </div>
      <span className="pts-val" style={{color:statMode==="2025"?(has2025?"var(--amber)":"var(--text-muted)"):"inherit"}}>
        {score.toFixed(2)}
      </span>
      {!drafted && onPick
        ? <button className="btn btn-primary btn-sm" onClick={function(e){e.stopPropagation();onPick();}}>DRAFT</button>
        : <span style={{fontSize:10,color:"var(--text-muted)"}}>{drafted?"–":""}</span>
      }
    </div>
  );
}

// ── DraftPage ───────────────────────────────────────────────────────────────

function DraftPage({ setup, pool, draft: initDraft, onDraftComplete, myTeamIdx, onClaimTeam }) {
  var _d = useState(initDraft); var draft = _d[0]; var setDraft = _d[1];
  var _pf = useState("ALL"); var posFilter = _pf[0]; var setPosFilter = _pf[1];
  var _sr = useState(""); var search = _sr[0]; var setSearch = _sr[1];
  var _sa = useState(true); var showAvailOnly = _sa[0]; var setShowAvailOnly = _sa[1];
  var _ar = useState(myTeamIdx !== null ? myTeamIdx : 0); var activeRoster = _ar[0]; var setActiveRoster = _ar[1];
  var _to = useState(null); var toast = _to[0]; var setToast = _to[1];
  var _sp = useState(null); var slotPicker = _sp[0]; var setSlotPicker = _sp[1];
  var _sm = useState("proj"); var statMode = _sm[0]; var setStatMode = _sm[1];
  var _pi = useState(null); var playerInfo = _pi[0]; var setPlayerInfo = _pi[1];

  var has2025Data = useMemo(function(){ return pool.some(function(p){ return p.stats2025; }); }, [pool]);
  var draftRef = useRef(draft);
  draftRef.current = draft;
  var onDraftCompleteRef = useRef(onDraftComplete);
  onDraftCompleteRef.current = onDraftComplete;

  var snake = useMemo(function(){ return snakeOrder(TEAMS, ROUNDS); }, []);
  var draftedIds = useMemo(function(){ return new Set(draft.picks.map(function(p){ return p.playerId; })); }, [draft.picks]);
  var currentPickIdx = draft.picks.length;
  var isDraftDone = currentPickIdx >= TOTAL_PICKS;
  var onTheClock = isDraftDone ? null : snake[currentPickIdx];
  var isMyTurn = !isDraftDone && myTeamIdx !== null && onTheClock.teamIdx === myTeamIdx;

  // Real-time Firebase listener
  var myTeamIdxRef = useRef(myTeamIdx);
  myTeamIdxRef.current = myTeamIdx;

  useEffect(function() {
    var unsub = slisten(KEYS.draft, function(r) {
      if (!r) return;
      var local = draftRef.current;
      var remoteLen = r.picks ? r.picks.length : 0;
      var localLast = local.picks.length ? local.picks[local.picks.length-1].playerId : null;
      var remoteLast = remoteLen ? r.picks[remoteLen-1].playerId : null;
      if (remoteLen === local.picks.length && remoteLast === localLast) return;
      var safeDraft = { picks: r.picks || [] };
      setDraft(safeDraft);
      var cur = myTeamIdxRef.current;
      if (cur !== null) {
        var nextPick = snake[remoteLen];
        var wasMyTurn = local.picks.length < TOTAL_PICKS && snake[local.picks.length] && snake[local.picks.length].teamIdx === cur;
        if (!wasMyTurn && nextPick && nextPick.teamIdx === cur) {
          setToast({msg:"YOUR TURN — you're on the clock!", type:"success"});
        }
      }
      if (remoteLen >= TOTAL_PICKS) setTimeout(function(){ onDraftCompleteRef.current(safeDraft); }, 800);
    });
    return unsub;
  }, []);

  var teamName = function(idx) { return setup.teams[idx] ? setup.teams[idx].name : "Team "+(idx+1); };

  // Current team slot counts
  var currentTeamSlotCounts = useMemo(function() {
    if (isDraftDone || !onTheClock) return {};
    var counts = {C:0,"1B":0,"2B":0,"3B":0,SS:0,OF:0};
    draft.picks.filter(function(pk){ return pk.teamIdx === onTheClock.teamIdx; }).forEach(function(pk){
      if (counts[pk.playerPos] !== undefined) counts[pk.playerPos]++;
    });
    return counts;
  }, [draft.picks, onTheClock, isDraftDone]);

  function availableSlots(player) {
    var eligPos = (player.eligPos || [player.pos]).map(function(ep){ return ep === "DH" ? "OF" : ep; });
    return eligPos.filter(function(pos){ return (currentTeamSlotCounts[pos] || 0) < (SLOT_LIMITS[pos] || 99); });
  }

  async function commitPick(player, chosenPos) {
    if (isDraftDone) return;
    var live = await sget(KEYS.draft);
    var local = draftRef.current;
    var source = live || local;
    if (live) {
      var localLast = local.picks.length ? local.picks[local.picks.length-1].playerId : null;
      var liveLast  = live.picks.length  ? live.picks[live.picks.length-1].playerId  : null;
      if (live.picks.length !== local.picks.length || liveLast !== localLast) {
        setDraft(live); return;
      }
    }
    var livePickIdx = source.picks.length;
    var liveOnTheClock = snake[livePickIdx];
    if (!liveOnTheClock) return;
    var rosterSlot = chosenPos === "DH" ? "OF" : chosenPos;
    var newPick = {
      pickNum: livePickIdx+1, teamIdx: liveOnTheClock.teamIdx, round: liveOnTheClock.round,
      playerId: player.id, playerName: player.name, playerPos: rosterSlot,
      playerDisplayPos: player.pos, playerEligPos: player.eligPos || [player.pos], playerTeam: player.team
    };
    var newDraft = Object.assign({}, source, { picks: source.picks.concat([newPick]) });
    setDraft(newDraft);
    await sset(KEYS.draft, newDraft);
    setToast({msg: setup.teams[liveOnTheClock.teamIdx].name + " picks " + player.name, type:"success"});
    if (newDraft.picks.length >= TOTAL_PICKS) setTimeout(function(){ onDraftCompleteRef.current(newDraft); }, 800);
  }

  function makePick(player) {
    if (isDraftDone) return;
    var open = availableSlots(player);
    if (open.length === 0) {
      setToast({msg:"All " + (player.eligPos || [player.pos]).join("/") + " slots full for this team", type:"error"});
      return;
    }
    if (open.length === 1) { commitPick(player, open[0]); }
    else { setSlotPicker(Object.assign({}, player, { eligPos: open })); }
  }

  async function autoPickNext() {
    if (isDraftDone || !onTheClock) return;
    var drafted = draftedIds;
    var teamCounts = currentTeamSlotCounts;
    var needed = new Set(Object.keys(SLOT_LIMITS).filter(function(pos){ return (teamCounts[pos]||0) < SLOT_LIMITS[pos]; }));
    var next = projSortedPool.find(function(p) {
      if (drafted.has(p.id)) return false;
      var ep = (p.eligPos || [p.pos]).map(function(e){ return e==="DH"?"OF":e; });
      return ep.some(function(e){ return needed.has(e); });
    });
    if (!next) return;
    var eligMapped = (next.eligPos || [next.pos]).map(function(e){ return e==="DH"?"OF":e; });
    var eligNeeded = eligMapped.filter(function(e){ return needed.has(e); });
    var chosenSlot = eligNeeded.reduce(function(best,pos){ return (teamCounts[pos]||0) < (teamCounts[best]||0) ? pos : best; }, eligNeeded[0]);
    await commitPick(next, chosenSlot);
  }

  async function simulateRemaining() {
    if (isDraftDone) return;
    var live = await sget(KEYS.draft);
    var local = draftRef.current;
    var source = live || local;
    if (live) {
      var localLast = local.picks.length ? local.picks[local.picks.length-1].playerId : null;
      var liveLast  = live.picks.length  ? live.picks[live.picks.length-1].playerId  : null;
      if (live.picks.length !== local.picks.length || liveLast !== localLast) {
        setDraft(live); return;
      }
    }
    var simSlotCounts = Array.from({length:TEAMS}, function(){ return {C:0,"1B":0,"2B":0,"3B":0,SS:0,OF:0}; });
    source.picks.forEach(function(pk) {
      if (simSlotCounts[pk.teamIdx][pk.playerPos] !== undefined) simSlotCounts[pk.teamIdx][pk.playerPos]++;
    });
    var cur = source;
    for (var i = cur.picks.length; i < TOTAL_PICKS; i++) {
      var pickSlot = snake[i];
      var tIdx = pickSlot.teamIdx;
      var drafted = new Set(cur.picks.map(function(p){ return p.playerId; }));
      var tSlots = simSlotCounts[tIdx];
      var needed = new Set(Object.keys(SLOT_LIMITS).filter(function(pos){ return tSlots[pos] < SLOT_LIMITS[pos]; }));
      var next = projSortedPool.find(function(p) {
        if (drafted.has(p.id)) return false;
        var ep = (p.eligPos || [p.pos]).map(function(e){ return e==="DH"?"OF":e; });
        return ep.some(function(e){ return needed.has(e); });
      });
      if (!next) break;
      var em = (next.eligPos || [next.pos]).map(function(e){ return e==="DH"?"OF":e; });
      var en = em.filter(function(e){ return needed.has(e); });
      var slot = en.reduce(function(best,pos){ return tSlots[pos] < tSlots[best] ? pos : best; }, en[0]);
      simSlotCounts[tIdx][slot]++;
      var newPick = { pickNum:i+1, teamIdx:tIdx, round:pickSlot.round,
        playerId:next.id, playerName:next.name, playerPos:slot,
        playerDisplayPos:next.pos, playerEligPos:next.eligPos||[next.pos], playerTeam:next.team };
      cur = Object.assign({}, cur, { picks: cur.picks.concat([newPick]) });
    }
    setDraft(cur);
    await sset(KEYS.draft, cur);
    if (cur.picks.length >= TOTAL_PICKS) setTimeout(function(){ onDraftCompleteRef.current(cur); }, 300);
  }

  var sortedPool = useMemo(function(){
    return pool.slice().sort(function(a,b){ return playerScore(b,statMode) - playerScore(a,statMode); });
  }, [pool, statMode]);

  var projSortedPool = useMemo(function(){
    return pool.slice().sort(function(a,b){ return pts(b.proj) - pts(a.proj); });
  }, [pool]);

  var filteredPool = useMemo(function() {
    var p = sortedPool;
    if (showAvailOnly) p = p.filter(function(pl){ return !draftedIds.has(pl.id); });
    if (posFilter !== "ALL") p = p.filter(function(pl){
      return (pl.eligPos || [pl.pos]).includes(posFilter) || (posFilter === "OF" && pl.pos === "DH");
    });
    if (search.trim()) p = p.filter(function(pl){ return pl.name.toLowerCase().includes(search.toLowerCase()); });
    return p;
  }, [sortedPool, showAvailOnly, posFilter, search, draftedIds]);

  var rosters = useMemo(function() {
    var r = Array.from({length:TEAMS}, function(){ return []; });
    draft.picks.forEach(function(pk) {
      var player = pool.find(function(pl){ return pl.id === pk.playerId; });
      if (player) r[pk.teamIdx].push(Object.assign({}, player, {draftedSlot:pk.playerPos,draftRound:pk.round,pickNum:pk.pickNum}));
    });
    return r;
  }, [draft.picks, pool]);

  return (
    <div className="page">
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={function(){ setToast(null); }} />}

      {myTeamIdx === null && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.92)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:22,overflowY:"auto"}}>
          <div style={{background:"var(--card)",border:"1px solid var(--green-border)",borderRadius:16,padding:30,maxWidth:420,width:"100%"}}>
            <div style={{background:"rgba(61,220,110,.08)",border:"1px solid var(--green-border)",borderRadius:10,padding:"10px 14px",marginBottom:22,display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontSize:18}}>🎲</span>
              <div>
                <div style={{fontSize:12,fontWeight:700,color:"var(--green)",letterSpacing:.5}}>Draft order was randomly assigned</div>
                <div style={{fontSize:11,color:"var(--text-muted)",marginTop:2}}>Pick numbers shown below are your snake positions</div>
              </div>
            </div>
            <div style={{fontSize:22,fontWeight:800,color:"var(--text)",marginBottom:4}}>Claim Your Team</div>
            <div style={{fontSize:12,color:"var(--text-muted)",marginBottom:18}}>Tap your name to lock in your spot.</div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {setup.teams.map(function(t,i){
                var draftSnake = snakeOrder(TEAMS, ROUNDS);
                var picks = [draftSnake[i].pickNum];
                for (var r = 1; r < Math.min(3, ROUNDS); r++) {
                  picks.push(draftSnake[r * TEAMS + (r % 2 === 0 ? i : TEAMS - 1 - i)].pickNum);
                }
                return (
                  <button key={i} className="btn btn-secondary" onClick={function(){ onClaimTeam(i); }}
                    style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 16px",borderRadius:10}}>
                    <div style={{textAlign:"left"}}>
                      <div style={{fontWeight:700,fontSize:15}}>{t.name}</div>
                      <div style={{fontSize:10,color:"var(--text-muted)",marginTop:2}}>Picks {picks.join(", ")}…</div>
                    </div>
                    <span style={{fontSize:13,fontWeight:800,color:"var(--green)",background:"var(--green-dim)",border:"1px solid var(--green-border)",borderRadius:8,padding:"4px 10px"}}>
                      Pick #{i+1}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {playerInfo && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.60)",zIndex:250,display:"flex",alignItems:"flex-end"}}
          onClick={function(){ setPlayerInfo(null); }}>
          <div style={{background:"var(--card)",borderTop:"1px solid var(--border)",borderRadius:"18px 18px 0 0",padding:"20px 18px 32px",width:"100%",maxHeight:"85vh",overflowY:"auto"}}
            onClick={function(e){ e.stopPropagation(); }}>

            <div style={{width:36,height:4,borderRadius:2,background:"var(--border)",margin:"0 auto 18px"}}></div>

            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:18}}>
              <PosBadge pos={playerInfo.pos} />
              <div style={{flex:1}}>
                <div style={{fontSize:18,fontWeight:700}}>{playerInfo.name}</div>
                <div style={{fontSize:12,color:"var(--text-muted)",marginTop:1}}>{playerInfo.team}</div>
              </div>
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:18}}>
              <div style={{background:"var(--surface)",borderRadius:10,padding:14,border:"1px solid var(--green-border)"}}>
                <div style={{fontSize:10,fontWeight:700,color:"var(--green)",letterSpacing:1,marginBottom:10}}>STEAMER 2026</div>
                {[["R",playerInfo.proj.R],["HR",playerInfo.proj.HR],["RBI",playerInfo.proj.RBI],["SB",playerInfo.proj.SB],["AVG",playerInfo.proj.AVG.toFixed(3)]].map(function(row){
                  return (
                    <div key={row[0]} style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                      <span style={{fontSize:11,color:"var(--text-muted)"}}>{row[0]}</span>
                      <span style={{fontSize:11,fontWeight:600}}>{row[1]}</span>
                    </div>
                  );
                })}
                <div style={{borderTop:"1px solid var(--border)",paddingTop:8,marginTop:4,display:"flex",justifyContent:"space-between"}}>
                  <span style={{fontSize:11,color:"var(--text-muted)"}}>PTS</span>
                  <span style={{fontSize:13,fontWeight:800,color:"var(--green)"}}>{pts(playerInfo.proj).toFixed(2)}</span>
                </div>
              </div>
              <div style={{background:"var(--surface)",borderRadius:10,padding:14,border:"1px solid var(--amber-border)"}}>
                <div style={{fontSize:10,fontWeight:700,color:"var(--amber)",letterSpacing:1,marginBottom:10}}>2025 ACTUAL</div>
                {playerInfo.stats2025 ? (
                  <div>
                    {[["R",playerInfo.stats2025.R],["HR",playerInfo.stats2025.HR],["RBI",playerInfo.stats2025.RBI],["SB",playerInfo.stats2025.SB],["AVG",playerInfo.stats2025.AVG.toFixed(3)]].map(function(row){
                      return (
                        <div key={row[0]} style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                          <span style={{fontSize:11,color:"var(--text-muted)"}}>{row[0]}</span>
                          <span style={{fontSize:11,fontWeight:600}}>{row[1]}</span>
                        </div>
                      );
                    })}
                    <div style={{borderTop:"1px solid var(--border)",paddingTop:8,marginTop:4,display:"flex",justifyContent:"space-between"}}>
                      <span style={{fontSize:11,color:"var(--text-muted)"}}>PTS</span>
                      <span style={{fontSize:13,fontWeight:800,color:"var(--amber)"}}>{pts(playerInfo.stats2025).toFixed(2)}</span>
                    </div>
                  </div>
                ) : (
                  <div style={{fontSize:11,color:"var(--text-muted)",marginTop:6}}>No 2025 stats available</div>
                )}
              </div>
            </div>

            {(function(){
              var drafted = draftedIds.has(playerInfo.id);
              var open = availableSlots(playerInfo);
              var slotsFull = !drafted && !isDraftDone && open.length === 0;
              var canPick = !drafted && !isDraftDone && isMyTurn && !slotsFull;
              if (drafted) {
                return <div style={{textAlign:"center",padding:"12px 0",fontSize:13,color:"var(--text-muted)",fontWeight:600}}>Already drafted</div>;
              }
              if (isDraftDone) return null;
              if (!isMyTurn) {
                return <div style={{textAlign:"center",padding:"12px 0",fontSize:13,color:"var(--text-muted)"}}>Not your pick</div>;
              }
              if (slotsFull) {
                return <div style={{textAlign:"center",padding:"12px 0",fontSize:13,color:"var(--red)"}}>All {(playerInfo.eligPos||[playerInfo.pos]).join("/")} slots full</div>;
              }
              return (
                <button className="btn btn-primary" style={{width:"100%",fontSize:15,padding:"14px"}}
                  onClick={function(){ setPlayerInfo(null); makePick(playerInfo); }}>
                  DRAFT {playerInfo.name.split(" ").pop().toUpperCase()}
                </button>
              );
            })()}
          </div>
        </div>
      )}

      {slotPicker && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.75)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:22}}
          onClick={function(){ setSlotPicker(null); }}>
          <div style={{background:"var(--card)",border:"1px solid var(--green-border)",borderRadius:11,padding:24,maxWidth:340,width:"100%"}}
            onClick={function(e){ e.stopPropagation(); }}>
            <div style={{fontSize:21,color:"var(--green)",letterSpacing:2,marginBottom:3,fontWeight:800}}>CHOOSE SLOT</div>
            <div style={{fontSize:14,fontWeight:700,marginBottom:3}}>{slotPicker.name}</div>
            <div style={{fontSize:11,color:"var(--text-muted)",marginBottom:15}}>
              {slotPicker.team} · {(slotPicker.eligPos || [slotPicker.pos]).join(" / ")}
            </div>
            <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:14}}>
              {(slotPicker.eligPos || [slotPicker.pos]).map(function(pos){
                return (
                  <button key={pos} className={"badge badge-"+pos}
                    onClick={function(){ commitPick(slotPicker, pos); setSlotPicker(null); }}
                    style={{fontSize:12,padding:"8px 18px",cursor:"pointer",borderRadius:6,fontWeight:700}}>
                    {pos}
                  </button>
                );
              })}
            </div>
            <button className="btn btn-secondary btn-sm" onClick={function(){ setSlotPicker(null); }}>CANCEL</button>
          </div>
        </div>
      )}

      {isDraftDone ? (
        <div className="draft-complete">
          <h2>DRAFT COMPLETE</h2>
          <p>All {TOTAL_PICKS} picks made</p>
          <button className="btn btn-success mt-16" onClick={function(){ onDraftCompleteRef.current(draft); }}>VIEW FULL ROSTERS →</button>
        </div>
      ) : (
        <div className="clock-banner" style={isMyTurn ? {border:"1px solid var(--accent)",animation:"your-turn-pulse 1.4s ease infinite"} : {}}>
          <div>
            {isMyTurn && <div style={{fontSize:9,color:"var(--green)",letterSpacing:2,marginBottom:3,fontWeight:700}}>▶ YOUR PICK</div>}
            <div className="clock-team">{teamName(onTheClock.teamIdx)} ON THE CLOCK</div>
            <div className="clock-info">Round {onTheClock.round} of {ROUNDS} · Pick {currentPickIdx+1} of {TOTAL_PICKS}</div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <button className="btn btn-secondary btn-sm" onClick={autoPickNext}
              style={{background:"rgba(61,220,110,.15)",border:"1px solid var(--green-border)",color:"var(--green)",fontWeight:700}}>
              AUTO PICK
            </button>
            <button className="btn btn-secondary btn-sm" onClick={simulateRemaining}
              style={{opacity:.55,border:"1px dashed var(--border)"}}>
              SIM REST
            </button>
            <div style={{textAlign:"right",fontSize:11}}>
              <div style={{color:"var(--text-muted)",marginBottom:2}}>NEXT UP</div>
              {currentPickIdx+1 < TOTAL_PICKS && (
                <div style={{color:snake[currentPickIdx+1] && snake[currentPickIdx+1].teamIdx===myTeamIdx?"var(--green)":"var(--text)"}}>
                  {teamName(snake[currentPickIdx+1].teamIdx)}
                  {snake[currentPickIdx+1] && snake[currentPickIdx+1].teamIdx===myTeamIdx?" (you)":""}
                </div>
              )}
              <div style={{color:"var(--text-muted)",marginTop:2}}>{TOTAL_PICKS-currentPickIdx} remaining</div>
            </div>
          </div>
        </div>
      )}

      <div className="draft-layout">
        <div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
            <div className="card-title" style={{marginBottom:0}}>PLAYER POOL</div>
            <div style={{display:"flex",gap:3,background:"var(--surface)",borderRadius:8,border:"1px solid var(--border)",padding:2}}>
              <button onClick={function(){ setStatMode("proj"); }}
                style={{padding:"4px 10px",borderRadius:6,border:"none",cursor:"pointer",fontWeight:700,fontSize:10,
                  background:statMode==="proj"?"var(--green)":"transparent",
                  color:statMode==="proj"?"#000":"var(--text-muted)"}}>
                PROJ
              </button>
              <button onClick={function(){ setStatMode("2025"); }}
                style={{padding:"4px 10px",borderRadius:6,border:"none",cursor:"pointer",fontWeight:700,fontSize:10,
                  background:statMode==="2025"?"var(--amber)":"transparent",
                  color:statMode==="2025"?"#000":"var(--text-muted)"}}>
                2025{!has2025Data ? "…" : ""}
              </button>
            </div>
          </div>
          <div className="filter-row">
            {["ALL"].concat(POSITIONS).map(function(p){
              return (
                <button key={p} className={"pos-filter" + (posFilter===p?" active":"")} onClick={function(){ setPosFilter(p); }}>{p}</button>
              );
            })}
            <button className={"pos-filter" + (showAvailOnly?" active":"")} onClick={function(){ setShowAvailOnly(function(v){ return !v; }); }}>AVAIL</button>
          </div>
          <div className="search-bar" style={{marginBottom:8}}>
            <span className="search-icon">⌕</span>
            <input className="input" placeholder="Search player..." value={search} onChange={function(e){ setSearch(e.target.value); }} />
          </div>
          <PlayerRowHeader statMode={statMode} />
          <div style={{maxHeight:"62vh",overflowY:"auto",marginTop:2}}>
            {filteredPool.slice(0,200).map(function(player) {
              var drafted = draftedIds.has(player.id);
              var globalRank = sortedPool.findIndex(function(p){ return p.id===player.id; }) + 1;
              var open = availableSlots(player);
              var slotsFull = !drafted && !isDraftDone && open.length === 0;
              var canPick = !drafted && !isDraftDone && isMyTurn && !slotsFull;
              return (
                <PlayerRow key={player.id} player={player} rank={globalRank} drafted={drafted}
                  onPick={canPick ? function(){ makePick(player); } : null}
                  onInfo={function(){ setPlayerInfo(player); }}
                  notYourTurn={!isDraftDone && !isMyTurn && !drafted && !slotsFull}
                  slotsFull={slotsFull}
                  statMode={statMode} />
              );
            })}
          </div>
        </div>

        <div>
          <div className="card-title">ROSTERS</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:10}}>
            {setup.teams.map(function(t,i){
              return (
                <button key={i} className={"pos-filter" + (activeRoster===i?" active":"")}
                  onClick={function(){ setActiveRoster(i); }} style={{fontSize:10}}>
                  {t.name} <span style={{color:"var(--text-muted)"}}>({rosters[i].length})</span>
                </button>
              );
            })}
          </div>

          {(function() {
            var roster = rosters[activeRoster];
            var slotFills = {};
            SLOT_DEFS.forEach(function(d){ slotFills[d.pos] = []; });
            roster.forEach(function(p) {
              var slot = p.draftedSlot || p.pos;
              if (slotFills[slot]) slotFills[slot].push(p);
            });
            var needs = SLOT_DEFS
              .filter(function(d){ return (slotFills[d.pos]||[]).length < d.count; })
              .map(function(d){
                var have = (slotFills[d.pos]||[]).length;
                return d.pos + (d.count-have > 1 ? " x"+(d.count-have) : "");
              });
            return (
              <div className="roster-mini" style={{marginBottom:12,maxHeight:"58vh",overflowY:"auto"}}>
                <div className="roster-mini-header" style={{position:"sticky",top:0,zIndex:2}}>
                  <span>{setup.teams[activeRoster] ? setup.teams[activeRoster].name : ""}</span>
                  <span style={{color:"var(--text-muted)"}}>{roster.length}/{ROUNDS}</span>
                </div>
                {SLOT_DEFS.map(function(d){
                  return Array.from({length:d.count}, function(_,i){
                    var player = (slotFills[d.pos]||[])[i] || null;
                    return (
                      <div key={d.pos+"-"+i} className="roster-mini-row" style={{gap:7}}>
                        <span style={{fontSize:9,width:30,flexShrink:0,textAlign:"center",borderRadius:4,padding:"2px 4px",
                          color:player?"var(--green)":"var(--text-muted)",
                          background:player?"rgba(34,211,160,.07)":"rgba(255,255,255,.02)",
                          border:"1px solid "+(player?"var(--green-border)":"var(--border)")}}>
                          {d.pos}
                        </span>
                        {player ? (
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontSize:11,fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                              {player.name}
                            </div>
                            <div style={{fontSize:9,color:"var(--text-muted)"}}>{player.team} · R{player.draftRound}</div>
                          </div>
                        ) : (
                          <div style={{flex:1,fontSize:10,color:"var(--text-muted)",fontStyle:"italic"}}>— empty —</div>
                        )}
                        {player && <span style={{fontSize:10,color:"var(--green)"}}>{pts(player.proj).toFixed(2)}</span>}
                      </div>
                    );
                  });
                })}
                {roster.length < ROUNDS && needs.length > 0 && (
                  <div style={{padding:"7px 12px",background:"rgba(240,180,41,.04)",borderTop:"1px solid var(--amber-border)",fontSize:10,color:"var(--amber)",position:"sticky",bottom:0}}>
                    NEEDS: {needs.join(" · ")}
                  </div>
                )}
              </div>
            );
          })()}

          <div className="card">
            <div className="card-title">PICK LOG</div>
            <div className="pick-log">
              {draft.picks.length === 0
                ? <div style={{padding:"12px",color:"var(--text-muted)",fontSize:12}}>No picks yet</div>
                : draft.picks.slice().reverse().map(function(pk){
                    return (
                      <div key={pk.pickNum} className="pick-log-row">
                        <span className="pick-log-num">#{pk.pickNum}</span>
                        <span className="pick-log-team">{teamName(pk.teamIdx)}</span>
                        <span style={{flex:1,fontSize:12}}>{pk.playerName}</span>
                        <PosBadge pos={pk.playerDisplayPos || pk.playerPos} />
                      </div>
                    );
                  })
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


// ── RosterPage ──────────────────────────────────────────────────────────────

function buildRosters(draft, pool) {
  var r = Array.from({length:TEAMS}, function(){ return []; });
  draft.picks.forEach(function(pk) {
    var player = pool.find(function(pl){ return pl.id === pk.playerId; });
    if (player) r[pk.teamIdx].push(Object.assign({}, player, {draftedSlot:pk.playerPos, draftRound:pk.round, pickNum:pk.pickNum}));
  });
  return r;
}

function bestBallLineupForRoster(players, getScore) {
  var bySlot = {};
  SLOT_DEFS.forEach(function(d){ bySlot[d.pos] = []; });
  players.forEach(function(p) {
    var slot = p.draftedSlot || p.pos;
    if (bySlot[slot]) bySlot[slot].push(p);
  });
  SLOT_DEFS.forEach(function(d){
    bySlot[d.pos].sort(function(a,b){ return getScore(b) - getScore(a); });
  });
  var starters = [], used = new Set();
  SLOT_DEFS.forEach(function(d) {
    var filled = 0;
    for (var i = 0; i < bySlot[d.pos].length; i++) {
      var p = bySlot[d.pos][i];
      if (!used.has(p.id) && filled < d.count) {
        starters.push(Object.assign({}, p, {slot:d.pos, starter:true}));
        used.add(p.id); filled++;
      }
    }
  });
  var bench = players.filter(function(p){ return !used.has(p.id); }).sort(function(a,b){ return getScore(b) - getScore(a); });
  if (bench.length) starters.push(Object.assign({}, bench[0], {slot:"UTIL", starter:true}));
  bench.slice(1).forEach(function(p){ starters.push(Object.assign({}, p, {slot:p.draftedSlot||p.pos, starter:false})); });
  return starters;
}

function RosterPage({ setup, pool, draft, myTeamIdx }) {
  var _vm = useState("proj"); var viewMode = _vm[0]; var setViewMode = _vm[1];
  var _at = useState(myTeamIdx !== null ? myTeamIdx : 0); var activeTeam = _at[0]; var setActiveTeam = _at[1];

  var rosters = useMemo(function(){ return buildRosters(draft, pool); }, [draft, pool]);

  function getScore(p) {
    if (viewMode === "proj") return pts(p.proj);
    return p.stats2025 ? pts(p.stats2025) : 0;
  }

  var lineup = useMemo(function(){
    return bestBallLineupForRoster(rosters[activeTeam] || [], getScore);
  }, [rosters, activeTeam, viewMode]);

  var totalPts = lineup.filter(function(p){ return p.starter; }).reduce(function(s,p){ return s + getScore(p); }, 0);
  var has2025 = pool.some(function(p){ return p.stats2025; });

  var teamTotals = useMemo(function(){
    return rosters.map(function(roster){
      var lu = bestBallLineupForRoster(roster, getScore);
      return lu.filter(function(p){ return p.starter; }).reduce(function(s,p){ return s + getScore(p); }, 0);
    });
  }, [rosters, viewMode]);

  function statLabel(p) {
    if (viewMode === "proj") return pts(p.proj).toFixed(2);
    return p.stats2025 ? pts(p.stats2025).toFixed(2) : "0.00";
  }

  function statDetail(p) {
    var s = viewMode === "proj" ? p.proj : p.stats2025;
    if (!s) return viewMode === "2025" ? "no 2025 stats" : null;
    return s.R+"R · "+s.HR+"HR · "+s.RBI+"RBI · "+s.SB+"SB · "+s.AVG.toFixed(3);
  }

  var SLOT_COLORS = {
    C:    {bg:"rgba(245,200,66,.15)",  border:"rgba(245,200,66,.5)",  text:"#f5c842", bar:"#f5c842"},
    "1B": {bg:"rgba(61,220,110,.15)",  border:"rgba(61,220,110,.5)",  text:"#3ddc6e", bar:"#3ddc6e"},
    "2B": {bg:"rgba(139,92,246,.15)",  border:"rgba(139,92,246,.5)",  text:"#c4b5fd", bar:"#a78bfa"},
    "3B": {bg:"rgba(236,72,153,.15)",  border:"rgba(236,72,153,.5)",  text:"#f9a8d4", bar:"#ec4899"},
    SS:   {bg:"rgba(56,189,248,.15)",  border:"rgba(56,189,248,.5)",  text:"#7dd3fc", bar:"#38bdf8"},
    OF:   {bg:"rgba(251,113,133,.15)", border:"rgba(251,113,133,.5)", text:"#fda4af", bar:"#fb7185"},
    UTIL: {bg:"rgba(99,102,241,.15)",  border:"rgba(99,102,241,.5)",  text:"#a5b4fc", bar:"#818cf8"},
  };

  return (
    <div className="page">
      <div style={{marginBottom:16}}>
        <div className="section-title">DRAFT COMPLETE</div>
        <div className="section-sub">All {TOTAL_PICKS} picks made · Good luck!</div>
      </div>

      <div style={{display:"flex",gap:4,marginBottom:14,background:"var(--surface)",borderRadius:10,border:"1px solid var(--border)",padding:3,width:"fit-content"}}>
        {[["proj","STEAMER 2026"],["2025","2025 STATS"]].map(function(kl){
          return (
            <button key={kl[0]} onClick={function(){ setViewMode(kl[0]); }}
              style={{padding:"8px 16px",borderRadius:8,border:"none",cursor:"pointer",fontWeight:700,fontSize:12,
                background:viewMode===kl[0]?"var(--green)":"transparent",
                color:viewMode===kl[0]?"#000":"var(--text-muted)"}}>
              {kl[1]}
              {kl[0]==="2025" && !has2025 && <span style={{fontSize:10,marginLeft:4,opacity:.6}}>(uploading…)</span>}
            </button>
          );
        })}
      </div>

      <div style={{display:"flex",gap:4,marginBottom:16,overflowX:"auto",paddingBottom:2,WebkitOverflowScrolling:"touch"}}>
        {setup.teams.map(function(t,i){
          return (
            <button key={i} onClick={function(){ setActiveTeam(i); }}
              style={{flexShrink:0,padding:"8px 14px",borderRadius:20,
                border:"1px solid "+(activeTeam===i?"var(--green)":"var(--border)"),
                background:activeTeam===i?"var(--green-dim)":"transparent",
                color:activeTeam===i?"var(--green)":"var(--text-muted)",
                fontWeight:activeTeam===i?700:500,fontSize:13,cursor:"pointer",whiteSpace:"nowrap"}}>
              {t.name}{i===myTeamIdx?" ★":""}
            </button>
          );
        })}
      </div>

      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
        <div>
          <div style={{fontSize:22,fontWeight:800}}>
            {setup.teams[activeTeam] ? setup.teams[activeTeam].name : ""}
            {activeTeam===myTeamIdx && <span style={{fontSize:13,color:"var(--green)",marginLeft:8}}>★ YOU</span>}
          </div>
          <div style={{fontSize:12,color:"var(--text-muted)",marginTop:2}}>{ROUNDS} picks · Best ball lineup</div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontSize:24,fontWeight:800,color:"var(--green)"}}>{totalPts.toFixed(2)}</div>
          <div style={{fontSize:11,color:"var(--text-muted)"}}>proj pts</div>
        </div>
      </div>

      <div className="roster-mini" style={{marginBottom:16}}>
        {lineup.map(function(player, i){
          var score = getScore(player);
          var detail = statDetail(player);
          var isStarter = player.starter;
          var slotKey = player.slot === "UTIL" ? "UTIL" : player.slot;
          var col = SLOT_COLORS[slotKey] || SLOT_COLORS["OF"];
          return (
            <div key={player.id+"-"+i}
              style={{display:"flex",alignItems:"center",gap:10,padding:"11px 14px",
                borderTop:i>0?"1px solid var(--border-subtle)":"none",
                borderLeft:"3px solid "+(isStarter?col.bar:"transparent"),
                background:isStarter?"rgba(255,255,255,.02)":"transparent",
                opacity:isStarter?1:0.35}}>
              <span style={{fontSize:10,fontWeight:700,width:36,flexShrink:0,textAlign:"center",borderRadius:5,padding:"3px 4px",
                color:isStarter?col.text:"var(--text-muted)",
                background:isStarter?col.bg:"rgba(255,255,255,.03)",
                border:"1px solid "+(isStarter?col.border:"var(--border)")}}>
                {player.slot}
              </span>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                  {player.name}
                </div>
                {detail && <div style={{fontSize:10,color:"var(--text-muted)",marginTop:1}}>{detail}</div>}
              </div>
              <span style={{fontSize:14,fontWeight:700,color:isStarter?col.text:"var(--text-muted)",minWidth:40,textAlign:"right"}}>
                {score.toFixed(2)}
              </span>
            </div>
          );
        })}
      </div>

      <div className="card">
        <div className="card-title">ALL TEAMS · {viewMode==="proj"?"STEAMER 2026":"2025 STATS"}</div>
        {rosters.map(function(roster, i){ return {i:i, name:setup.teams[i].name, total:teamTotals[i]}; })
          .sort(function(a,b){ return b.total - a.total; })
          .map(function(t, rank){
            return (
              <div key={t.i} style={{display:"flex",alignItems:"center",gap:10,padding:"12px 0",
                borderTop:rank>0?"1px solid var(--border-subtle)":"none"}}>
                <span style={{fontSize:18,width:28}}>{rank===0?"🥇":rank===1?"🥈":rank===2?"🥉":""}</span>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontSize:16}}>
                    {t.name}
                    {t.i===myTeamIdx && <span style={{fontSize:11,color:"var(--green)",marginLeft:6}}>★</span>}
                  </div>
                </div>
                <button onClick={function(){ setActiveTeam(t.i); }}
                  style={{fontSize:11,color:"var(--text-muted)",background:"transparent",border:"1px solid var(--border)",borderRadius:6,padding:"3px 8px",cursor:"pointer"}}>
                  VIEW
                </button>
                <span style={{fontSize:16,fontWeight:700,color:t.total>0?"var(--green)":"var(--text-muted)",minWidth:50,textAlign:"right"}}>
                  {t.total>0?t.total.toFixed(2):"—"}
                </span>
              </div>
            );
          })
        }
      </div>
    </div>
  );
}

// ── App ─────────────────────────────────────────────────────────────────────

var TEAM_NAMES = ["Brown","CDub","Trey","Kevin","Ethan","Blake"];

function randomizeTeams() {
  var indices = [0,1,2,3,4,5];
  for (var i = indices.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = indices[i]; indices[i] = indices[j]; indices[j] = tmp;
  }
  return indices.map(function(i){ return {name: TEAM_NAMES[i]}; });
}

export default function App() {
  var _mo = useState("loading"); var mode = _mo[0]; var setMode = _mo[1];
  var _se = useState(null); var setup = _se[0]; var setSetup = _se[1];
  var _po = useState(null); var pool = _po[0]; var setPool = _po[1];
  var _dr = useState(null); var draft = _dr[0]; var setDraft = _dr[1];
  var _mt = useState(null); var myTeamIdx = _mt[0]; var setMyTeamIdx = _mt[1];

  useEffect(function() {
    // Show app immediately — no blocking on backend
    var savedClaim = lsGet(KEYS.claim);
    if (savedClaim !== null) setMyTeamIdx(savedClaim);

    // Try backend in background with short timeout
    (async function() {
      try {
        var results = await Promise.race([
          Promise.all([sget(KEYS.mode), sget(KEYS.setup), sget(KEYS.draft)]),
          new Promise(function(res){ setTimeout(function(){ res([null,null,null]); }, 3000); })
        ]);
        var savedMode = results[0]; var savedSetup = results[1]; var savedDraft = results[2];
        if (savedMode && savedSetup && savedDraft) {
          setSetup(savedSetup); setPool(SAMPLE_POOL); setDraft(savedDraft);
          var draftDone = savedDraft.picks && savedDraft.picks.length >= TEAMS * ROUNDS;
          setMode(draftDone ? "done" : "draft");
          return;
        }
      } catch {}
      // Fresh start
      var teams = randomizeTeams();
      var newSetup = { teams: teams, createdAt: Date.now(), randomized: true };
      var newDraft = { picks: [] };
      setSetup(newSetup); setPool(SAMPLE_POOL); setDraft(newDraft);
      setMode("draft");
      sset(KEYS.setup, newSetup);
      sset(KEYS.draft, newDraft);
      sset(KEYS.mode, "draft");
    })();
  }, []);

  function claimTeam(idx) { setMyTeamIdx(idx); lsSet(KEYS.claim, idx); }

  async function handleDraftComplete(finalDraft) {
    setDraft(finalDraft);
    await sset(KEYS.draft, finalDraft);
    await sset(KEYS.mode, "done");
    setMode("done");
  }

  function resetAll() {
    lsDel(KEYS.claim);
    var teams = randomizeTeams();
    var newSetup = { teams: teams, createdAt: Date.now(), randomized: true };
    var newDraft = { picks: [] };
    setMyTeamIdx(null); setSetup(newSetup); setPool(SAMPLE_POOL); setDraft(newDraft); setMode("draft");
    sset(KEYS.setup, newSetup);
    sset(KEYS.draft, newDraft);
    sset(KEYS.mode, "draft");
    Promise.all([KEYS.mode, KEYS.setup, KEYS.draft].map(function(k){ return sdel(k); }));
  }

  if (mode === "loading") {
    return (
      <div>
        <style>{CSS}</style>
        <div className="app" style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh"}}>
          <div style={{fontSize:28,color:"var(--green)",letterSpacing:4,fontWeight:800}}>LOADING…</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <style>{CSS}</style>
      <div className="app">
        <nav className="nav">
          <div>
            <div className="nav-logo">FANBALL<span>·26</span></div>
            <div className="nav-sub">FANTASY BASEBALL · BEST BALL · 6 TEAMS</div>
          </div>
          <div className="nav-spacer"></div>
          {mode==="draft" && pool && (
            <div className="pool-badge">
              <span className="dot"></span>STEAMER · {pool.length} players
            </div>
          )}
          <span className={"nav-mode " + (mode==="done"?"season":mode)}>
            {mode==="done"?"complete":mode}
          </span>
          <button className="btn btn-danger btn-sm" onClick={resetAll}>↺ RESET</button>
        </nav>

        {mode==="draft" && setup && pool && draft && (
          <DraftPage setup={setup} pool={pool} draft={draft}
            onDraftComplete={handleDraftComplete}
            myTeamIdx={myTeamIdx} onClaimTeam={claimTeam} />
        )}

        {mode==="done" && setup && pool && draft && (
          <RosterPage setup={setup} pool={pool} draft={draft} myTeamIdx={myTeamIdx} />
        )}
      </div>
    </div>
  );
}

