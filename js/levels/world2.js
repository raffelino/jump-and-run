/**
 * Dunkle Höhlen
 * Steinige Höhlen mit engen Passagen
 */

/**
 * Legende:
 * . = Luft (air)
 * G = Boden (ground)
 * B = Ziegel (brick)
 * P = Rohr (pipe)
 * p = Plattform (platform - nur von oben begehbar)
 * S = Stein (stone)
 * C = Kristall (crystal)
 * L = Lava (deadly - tödlich)
 * c = Wolke (cloud platform)
 * M = Metall (metal)
 * I = Eis (ice - rutschig)
 * W = Holz (wood)
 * o = Münze (coin)
 * 1 = Gegner Typ 1 (walking enemy)
 * 2 = Gegner Typ 2 (flying enemy)
 * 3 = Gegner Typ 3 (shooting enemy)
 */

export const world2 = {
    name: "Dunkle Höhlen",
    levels: [
    // Level 1
    {
        width: 100,
        height: 25,
        isCave: true,
        groundTileType: "S",
        spawn: { x: 64, y: 555 },
        goal: { x: 3040, y: 575 },
        map: [
            "...............SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS...............",
            "...............SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS...............",
            "...............SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSoSSSSSSSSSSSSSS...............",
            "......................................................................o.............................",
            "......................................................................o.............................",
            "...............................o......................................o.............................",
            "............................WWWo...............................o......o.............................",
            "............................WWWo........oooooooo...............o....................................",
            "............................WWW.........pppppppp...............o....................................",
            "............................WWW................................o....................................",
            "..........................o.WWW.o.........................................oopppppp..................",
            ".........................................oooo.............................SSSSSS....................",
            ".........................................SSSS.............................SSSSSS....................",
            ".........................................SSSS.............................SSSSSS....................",
            "................................pppppppppSSSS............................oSSSSSSo...................",
            ".........................................SSSS.............................SSSSSS....................",
            "....................cccccccccccc.........SSSS.......................................................",
            "....................................................................................................",
            "...................................................cccccccccc.......................................",
            "....................................................................................................",
            "SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS...SSSSS......SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS",
            "SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS...SSSSS......SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS",
            "SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS...SSSSS......SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS",
            "SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS...SSSSS......SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS",
            "SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS...SSSSS......SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS"
        ],
        enemies: [
            { type: "walking", x: 768, y: 608 },
            { type: "jumping", x: 2400, y: 608 },
            { type: "jumping", x: 2560, y: 608 },
            { type: "bat", x: 2176, y: 256 }
        ]
    },

    // Level 2
    {
        width: 100,
        height: 25,
        isCave: true,
        groundTileType: "S",
        spawn: { x: 64, y: 555 },
        goal: { x: 3040, y: 575 },
        map: [
            "...............SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS...............",
            "...............SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS...............",
            "...............SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS...............",
            "....................................................................................................",
            "....................................................................................................",
            ".........................WW...........................o.....oooooo..................................",
            "................WW.......WW...........................o.............................................",
            "................WW.......WW...........................o.............................................",
            "................WW.......WW....oooooo...............................................................",
            "................WW...........................ooooooo................................................",
            "................WW...........................ppppppp................................................",
            "................WW..................................................................................",
            "...............ooooooo............ooooooo...........................................................",
            "...............SSSSSSS...........cccooooooc.........ooooo.....ooooo.................................",
            "...............SSSSSSS..............SSSSSS.........oSSSSSopcccSSSSS.................................",
            "...............SSSSSSS.........oooooSSSSSS........ccSSSSSccc..SSSSS.................................",
            "..............................ccccccSSSSSS..........SSSSS.....SSSSS.................................",
            "....................................SSSSSS..........SSSSS...........................................",
            "...................................................................cccccccc.........................",
            "....................................................................................................",
            "SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSLLLLLLL.SSSSSSSLLLLLLLLLSSSSSSSSS.....S...SSSSSSSSSSSSSSSSSSSSSSSS",
            "SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSLLLLLLL.SSSSSSSLLLLLLLLLSSSSSSSSS.....S...SSSSSSSSSSSSSSSSSSSSSSSS",
            "SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS......SSSSSSSLLLLLLLLLSSSSSSSSS.....S...SSSSSSSSSSSSSSSSSSSSSSSS",
            "SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS......SSSSSSSLLLLLLLLLSSSSSSSSS.....S...SSSSSSSSSSSSSSSSSSSSSSSS",
            "SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS......SSSSSSSSSSSS....SSSSSSSSS.....S...SSSSSSSSSSSSSSSSSSSSSSSS"
        ],
        enemies: [
            { type: "jumping", x: 1920, y: 608 },
            { type: "walking", x: 1440, y: 608 },
            { type: "walking", x: 2112, y: 608 },
            { type: "jumping", x: 640, y: 608 },
            { type: "stalactite", x: 1952, y: 96 },
            { type: "bat", x: 1216, y: 256 },
            { type: "flying", x: 1664, y: 352 }
        ]
    },

    // Level 3
    {
        width: 100,
        height: 25,
        isCave: true,
        groundTileType: "S",
        spawn: { x: 64, y: 555 },
        goal: { x: 3040, y: 575 },
        map: [
            "...............SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS...............",
            "...............SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS...............",
            "...............SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS...............",
            "....................................................................................................",
            "....................................WW..............................................................",
            "...................oooooo...........oW..............................................................",
            "....................................oW..............................................................",
            "........................o...........oW..............................................................",
            "........................o...oooooooooooo............................................................",
            "........................o...ppppppppp......oooo...................................SSS...............",
            ".......................ooooooo.............SSSS...................................SSS...............",
            ".......................SSSSSoS....ooooooo..SSSS.........................IIIIIIIII.SSS...............",
            ".....................ooooooIoIIIIIIIIIIIIcccSSS........................cIIIIIIIIIccSS...............",
            ".......................SSSSIIIIIIIIIIIIII..SWWW...................................SSS...............",
            "....................cccSSSSWWWWooo.........SWWW.....................................................",
            ".......................SSSSWWWWcccccc.....o.WWW.o.................IIIIIIIII.........................",
            "........................SSSWWWW...................................IIIIIIIII.........................",
            ".........................o.WWWW.o...................................................................",
            "................................................................ppppppp.........ccccc...............",
            "....................................................................................................",
            "SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS....SSSSSSSLLLLLLLL...SSSSSSSSSSSSSS......SSSSSSSSSSSSSSSSSSSSSSS",
            "SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS....SSSSSSSLLLLLLLL...SSSSSSSSSSSSSS......SSSSSSSSSSSSSSSSSSSSSSS",
            "SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS....SSSSSSSLLLLLLLL...SSSSSSSSSSSSSS......SSSSSSSSSSSSSSSSSSSSSSS",
            "SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS....SSSSSSSSSS........SSSSSSSSSSSSSS......SSSSSSSSSSSSSSSSSSSSSSS",
            "SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS....SSSSSSSSSS........SSSSSSSSSSSSSS......SSSSSSSSSSSSSSSSSSSSSSS"
        ],
        enemies: [
            { type: "jumping", x: 1312, y: 608 },
            { type: "jumping", x: 2208, y: 608 },
            { type: "walking", x: 1920, y: 608 },
            { type: "jumping", x: 1280, y: 608 },
            { type: "jumping", x: 800, y: 608 },
            { type: "stalactite", x: 1024, y: 96 },
            { type: "bat", x: 1824, y: 288 },
            { type: "flying", x: 1344, y: 224 },
            { type: "shooting", x: 2144, y: 448 }
        ]
    },

    // Level 4
    {
        width: 100,
        height: 25,
        isCave: true,
        groundTileType: "S",
        spawn: { x: 64, y: 555 },
        goal: { x: 3040, y: 575 },
        map: [
            "...............SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS...............",
            "...............SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS...............",
            "...............SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS...............",
            "....................................................................................................",
            "...................................................ooooooo..........................................",
            "..........................................oooooo...SSSSSSS..........................................",
            "................................ooooo..............SSSSSSS..........................................",
            "...................................................oSSSSSS...........o..........ooooo...............",
            "...............oooo................................oSSSSSS...........o.o.......cccccc...............",
            "...................................................o.................o.o........WWWoo...............",
            "...................................................o.......WW..........o........WWWpp...............",
            "........................................................oooWW..IIIIIIIIoII......WWWW................",
            ".................................................IIIIIIIIIIIIIIIIIIIIIIoII......WWWW................",
            ".................................................IIIIIIIIIIIIIIIIIIIISSS..ppppopWWWW................",
            "...............oooooo..cccccccc..................IIIIIIIIIIIIccccWW.SSSS............................",
            "...............pppppp...................cccccccccccc.............WW.SSSS............................",
            ".........................................IIIIIIIIIII.........ccccWWcSSSS............................",
            ".........................................IIIIIIIIIII...........o.WW.o........cccccccc...............",
            "....................................................................................................",
            "....................................................................................................",
            "SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSLLLLLLLL.SSSSSSSSSSLLLLLLLLS.........S.........SSSSSSSSSSSSSSSSSSSS",
            "SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSLLLLLLLL.SSSSSSSSSSLLLLLLLLS.........S.........SSSSSSSSSSSSSSSSSSSS",
            "SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSLLLLLLLL.SSSSSSSSSSLLLLLLLLS.........S.........SSSSSSSSSSSSSSSSSSSS",
            "SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS........SSSSSSSSSSSSSSSSSSS.........S.........SSSSSSSSSSSSSSSSSSSS",
            "SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS........SSSSSSSSSSSSSSSSSSS.........S.........SSSSSSSSSSSSSSSSSSSS"
        ],
        enemies: [
            { type: "walking", x: 1440, y: 608 },
            { type: "jumping", x: 1600, y: 608 },
            { type: "walking", x: 896, y: 608 },
            { type: "walking", x: 1600, y: 608 },
            { type: "jumping", x: 1920, y: 608 },
            { type: "jumping", x: 1568, y: 608 },
            { type: "stalactite", x: 2080, y: 96 },
            { type: "stalactite", x: 2208, y: 96 },
            { type: "bat", x: 1472, y: 256 },
            { type: "bat", x: 864, y: 224 },
            { type: "bat", x: 896, y: 320 }
        ]
    },

    // Level 5
    {
        width: 100,
        height: 25,
        isCave: true,
        groundTileType: "S",
        spawn: { x: 64, y: 555 },
        goal: { x: 3040, y: 575 },
        map: [
            "...............SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS...............",
            "...............SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS...............",
            "...............SSSSSSSSSoSSSSSSSSSSSSSSSSSSSSSSSSoSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS...............",
            "........................o..................o.....o................o.................................",
            "........................o..................o.....o................o.................................",
            "........................o..................oo....o................o.................................",
            ".....................................o.....oo....o..................................................",
            "........................ooooo..ooo...o.....oo.......................................................",
            ".......................ccccccccccc...o......o.......................................................",
            "....................o................o..........ooooooo.............................................",
            "....................o...........................ppppppp.............................................",
            "....................o..................................IIIIIIIIIII..................................",
            ".................oooo..................................IIIIIIIIIII..................................",
            ".................SSSS..........oooooooooo..............IIIIIIIIIII..................................",
            ".................SSScccccccccccppoooooppp....oooooo.................................p...............",
            ".................SSSS............SIIIIIIIIIpccccccccccc....................occcccccc................",
            ".................SSSS............SIIIIIIIII.....pppppppppp.........pppppppcccccccc..................",
            ".................SSSS............SSSSS......pppppppp................................................",
            ".....................................ccccccccccc.........................ccccccccccc................",
            "....................................................................................................",
            "SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS......SSSSSSSSSSS............SLLLLLLLLL........SSSSSSSSSSSSSSSSSSS",
            "SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS......SSSSSSSSSSS............SLLLLLLLLL........SSSSSSSSSSSSSSSSSSS",
            "SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS......SSSSSSSSSSS............SLLLLLLLLL........SSSSSSSSSSSSSSSSSSS",
            "SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS......SSSSSSSSSSS............SLLLLLLLLL........SSSSSSSSSSSSSSSSSSS",
            "SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS......SSSSSSSSSSS............SSSSSSS...........SSSSSSSSSSSSSSSSSSS"
        ],
        enemies: [
            { type: "walking", x: 1472, y: 608 },
            { type: "walking", x: 736, y: 608 },
            { type: "jumping", x: 1568, y: 608 },
            { type: "jumping", x: 1280, y: 608 },
            { type: "jumping", x: 1568, y: 608 },
            { type: "jumping", x: 928, y: 608 },
            { type: "jumping", x: 896, y: 608 },
            { type: "stalactite", x: 1440, y: 96 },
            { type: "stalactite", x: 2048, y: 96 },
            { type: "flying", x: 1536, y: 256 },
            { type: "bat", x: 2336, y: 224 },
            { type: "flying", x: 2112, y: 352 },
            { type: "shooting", x: 1504, y: 512 }
        ]
    }
    ]
};
