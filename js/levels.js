var Levels = [
  {
    "type": "outside",
    "zoom_level": "0",
    "cells": [
      {
        "x": 0,
        "z": 0,
        "walls": [],
        "script": ""
      },
      {
        "x": 1,
        "z": 0,
        "walls": [],
        "script": "game.set_zoom_level(1);\ngame.gui.box(\n  game.labels.get('helpme_title'),\n  game.labels.get('helpme_message'),\n  true\n);\n"
      },
      {
        "x": 2,
        "z": 1,
        "walls": [],
        "script": ""
      },
      {
        "x": 1,
        "z": 1,
        "walls": [],
        "script": ""
      },
      {
        "x": 2,
        "z": 2,
        "walls": [],
        "script": ""
      }
    ],
    "seals": [],
    "bears": [],
    "extrawalls": [],
    "end_cell": {
      "x": 2,
      "z": 2
    },
    "next_maze": {
      "x": 3,
      "z": 2
    },
    "pinga": [
      {
        "x": 1,
        "z": 0,
        "top": 0.49,
        "left": 0.47,
        "rotation": 113,
        "script": ""
      }
    ]
  },
  {
    "type": "indoor",
    "zoom_level": "1",
    "cells": [
      {
        "x": 0,
        "z": 0,
        "walls": [],
        "script": ""
      },
      {
        "x": 1,
        "z": 0,
        "walls": [
          {
            "type": 2,
            "i": 2
          },
          {
            "type": 2,
            "i": 3
          },
          {
            "type": 3,
            "i": 4
          },
          {
            "type": 2,
            "i": 5
          }
        ],
        "script": "\ngame.gui.box(\n  game.labels.get('level2_title'),\n  game.labels.get('level2_message'),\n  true\n);\n"
      },
      {
        "x": 2,
        "z": 1,
        "walls": [
          {
            "type": 3,
            "i": 0
          },
          {
            "type": 2,
            "i": 1
          },
          {
            "type": 2,
            "i": 2
          },
          {
            "type": 2,
            "i": 3
          },
          {
            "type": 3,
            "i": 4
          }
        ],
        "script": ""
      },
      {
        "x": 1,
        "z": 1,
        "walls": [
          {
            "type": 2,
            "i": 1
          },
          {
            "type": 2,
            "i": 3
          }
        ],
        "script": ""
      },
      {
        "x": 2,
        "z": 2,
        "walls": [],
        "script": ""
      }
    ],
    "seals": [],
    "bears": [
      {
        "x": 1,
        "z": 1,
        "top": 0.47,
        "left": 0.37,
        "patrol_positions": [
          {
            "x": 2,
            "z": 1,
            "top": 0.49,
            "left": 0.6,
            "patrol_wait": 1000
          },
          {
            "x": 2,
            "z": 1,
            "top": 0.75,
            "left": 0.5,
            "patrol_wait": 0
          },
          {
            "x": 1,
            "z": 1,
            "top": 0.39,
            "left": 0.83,
            "patrol_wait": 0
          }
        ],
        "patrol_loop": true,
        "patrol_wait": 2000,
        "drops": "",
        "rotation": 238
      }
    ],
    "extrawalls": [],
    "end_cell": {
      "x": 2,
      "z": 2
    },
    "next_maze": {
      "x": 3,
      "z": 2
    },
    "bear": [
      {
        "x": 1,
        "z": 1,
        "top": 0.47,
        "left": 0.37,
        "rotation": 238,
        "script": "",
        "patrol_loop": "true",
        "patrol_wait": "2000",
        "drops": ""
      }
    ],
    "pinga": [
      {
        "x": 1,
        "z": 0,
        "top": 0.51,
        "left": 0.52,
        "rotation": 113,
        "script": ""
      }
    ]
  },
  {
    "type": "outside",
    "zoom_level": "1",
    "cells": [
      {
        "x": 0,
        "z": 0,
        "walls": [],
        "script": ""
      },
      {
        "x": 2,
        "z": 0,
        "walls": [],
        "script": ""
      },
      {
        "x": 1,
        "z": 0,
        "walls": [],
        "script": ""
      },
      {
        "x": 0,
        "z": 1,
        "walls": [],
        "script": ""
      },
      {
        "x": 2,
        "z": 1,
        "walls": [
          {
            "type": 1,
            "i": 0
          },
          {
            "type": 1,
            "i": 1
          },
          {
            "type": 1,
            "i": 2
          },
          {
            "type": 1,
            "i": 3
          },
          {
            "type": 1,
            "i": 4
          },
          {
            "type": 3,
            "i": 5
          }
        ],
        "script": ""
      },
      {
        "x": 1,
        "z": 1,
        "walls": [],
        "script": ""
      },
      {
        "x": 3,
        "z": 1,
        "walls": [
          {
            "type": 1,
            "i": 0
          },
          {
            "type": 3,
            "i": 1
          },
          {
            "type": 1,
            "i": 2
          },
          {
            "type": 1,
            "i": 3
          },
          {
            "type": 1,
            "i": 4
          },
          {
            "type": 3,
            "i": 5
          }
        ],
        "script": ""
      },
      {
        "x": 2,
        "z": 2,
        "walls": [],
        "script": ""
      }
    ],
    "seals": [
      {
        "x": 1,
        "z": 1,
        "top": 0.23,
        "left": 0.4,
        "patrol_positions": [
          {
            "x": 1,
            "z": 1,
            "top": 0.55,
            "left": 0.8,
            "patrol_wait": 4000
          }
        ],
        "patrol_loop": true,
        "patrol_wait": 2000,
        "drops": "",
        "rotation": 0
      },
      {
        "x": 2,
        "z": 2,
        "top": 0.34,
        "left": 0.74,
        "patrol_positions": [],
        "patrol_loop": true,
        "patrol_wait": 2000,
        "drops": "",
        "rotation": 226
      }
    ],
    "bears": [],
    "extrawalls": [],
    "end_cell": {
      "x": 3,
      "z": 1
    },
    "next_maze": {
      "x": 4,
      "z": 2
    },
    "pinga": [
      {
        "x": 1,
        "z": 0,
        "top": 0.5,
        "left": 0.44,
        "rotation": 125,
        "script": ""
      }
    ],
    "chest": [
      {
        "x": 2,
        "z": 1,
        "top": 0.49,
        "left": 0.48,
        "rotation": 62,
        "script": "",
        "drops": "stick"
      }
    ]
  },
  {
    "type": "indoor",
    "zoom_level": "1",
    "cells": [
      {
        "x": 0,
        "z": 0,
        "walls": [],
        "script": ""
      },
      {
        "x": 2,
        "z": 0,
        "walls": [
          {
            "type": 4,
            "i": 5
          }
        ],
        "script": ""
      },
      {
        "x": 1,
        "z": 0,
        "walls": [
          {
            "type": 2,
            "i": 0
          }
        ],
        "script": "game.gui.box(\n  game.labels.get('level_door_title'),\n  game.labels.get('level_door_message'),\n  true\n);\n"
      },
      {
        "x": 3,
        "z": 0,
        "walls": [
          {
            "type": 2,
            "i": 4
          }
        ],
        "script": ""
      },
      {
        "x": 5,
        "z": 0,
        "walls": [
          {
            "type": 3,
            "i": 5
          }
        ],
        "script": ""
      },
      {
        "x": 2,
        "z": 1,
        "walls": [
          {
            "type": 2,
            "i": 3
          },
          {
            "type": 3,
            "i": 4
          }
        ],
        "script": ""
      },
      {
        "x": 4,
        "z": 1,
        "walls": [],
        "script": ""
      },
      {
        "x": 2,
        "z": 2,
        "walls": [],
        "script": ""
      },
      {
        "x": 4,
        "z": 2,
        "walls": [],
        "script": ""
      },
      {
        "x": 3,
        "z": 2,
        "walls": [],
        "script": ""
      },
      {
        "x": 4,
        "z": 3,
        "walls": [],
        "script": ""
      }
    ],
    "seals": [],
    "bears": [
      {
        "x": 2,
        "z": 1,
        "top": 0.47,
        "left": 0.46,
        "patrol_positions": [
          {
            "x": 2,
            "z": 2,
            "top": 0.43,
            "left": 0.49,
            "patrol_wait": 0
          },
          {
            "x": 3,
            "z": 2,
            "top": 0.49,
            "left": 0.54,
            "patrol_wait": 0
          },
          {
            "x": 4,
            "z": 2,
            "top": 0.49,
            "left": 0.53,
            "patrol_wait": 0
          },
          {
            "x": 4,
            "z": 1,
            "top": 0.47,
            "left": 0.54,
            "patrol_wait": 0
          },
          {
            "x": 3,
            "z": 0,
            "top": 0.48,
            "left": 0.53,
            "patrol_wait": 0
          }
        ],
        "patrol_loop": true,
        "patrol_wait": 2000,
        "drops": "",
        "rotation": 294
      },
      {
        "x": 4,
        "z": 1,
        "top": 0.38,
        "left": 0.52,
        "patrol_positions": [
          {
            "x": 3,
            "z": 0,
            "top": 0.42,
            "left": 0.43,
            "patrol_wait": 0
          },
          {
            "x": 2,
            "z": 1,
            "top": 0.48,
            "left": 0.38,
            "patrol_wait": 0
          },
          {
            "x": 2,
            "z": 2,
            "top": 0.54,
            "left": 0.43,
            "patrol_wait": 0
          },
          {
            "x": 3,
            "z": 2,
            "top": 0.59,
            "left": 0.51,
            "patrol_wait": 0
          },
          {
            "x": 4,
            "z": 2,
            "top": 0.57,
            "left": 0.46,
            "patrol_wait": 0
          }
        ],
        "patrol_loop": true,
        "patrol_wait": 2000,
        "drops": "",
        "rotation": 0
      },
      {
        "x": 3,
        "z": 2,
        "top": 0.51,
        "left": 0.39,
        "patrol_positions": [
          {
            "x": 4,
            "z": 2,
            "top": 0.47,
            "left": 0.39,
            "patrol_wait": 0
          },
          {
            "x": 4,
            "z": 1,
            "top": 0.47,
            "left": 0.45,
            "patrol_wait": 0
          },
          {
            "x": 3,
            "z": 0,
            "top": 0.52,
            "left": 0.45,
            "patrol_wait": 0
          },
          {
            "x": 2,
            "z": 1,
            "top": 0.39,
            "left": 0.49,
            "patrol_wait": 0
          },
          {
            "x": 2,
            "z": 2,
            "top": 0.41,
            "left": 0.41,
            "patrol_wait": 0
          }
        ],
        "patrol_loop": true,
        "patrol_wait": 2000,
        "drops": "",
        "rotation": 0
      }
    ],
    "extrawalls": [],
    "end_cell": {
      "x": 4,
      "z": 3
    },
    "next_maze": {
      "x": 5,
      "z": 3
    },
    "bear": [
      {
        "x": 2,
        "z": 1,
        "top": 0.47,
        "left": 0.46,
        "rotation": 294,
        "script": "",
        "patrol_loop": "true",
        "patrol_wait": "2000",
        "drops": ""
      },
      {
        "x": 4,
        "z": 1,
        "top": 0.38,
        "left": 0.52,
        "rotation": 0,
        "script": "",
        "patrol_loop": "true",
        "drops": "",
        "patrol_wait": "2000"
      },
      {
        "x": 3,
        "z": 2,
        "top": 0.51,
        "left": 0.39,
        "rotation": 0,
        "script": "",
        "patrol_loop": "true",
        "drops": "",
        "patrol_wait": "2000"
      }
    ],
    "pinga": [
      {
        "x": 2,
        "z": 0,
        "top": 0.55,
        "left": 0.35,
        "rotation": 65,
        "script": ""
      }
    ],
    "chest": [
      {
        "x": 5,
        "z": 0,
        "top": 0.49,
        "left": 0.47,
        "rotation": 68,
        "script": "",
        "drops": "key2-0-5"
      }
    ]
  },
  {
    "type": "outside",
    "zoom_level": "1",
    "cells": [
      {
        "x": 0,
        "z": 0,
        "walls": [],
        "script": ""
      },
      {
        "x": 1,
        "z": 0,
        "walls": [],
        "script": ""
      },
      {
        "x": 3,
        "z": 0,
        "walls": [],
        "script": ""
      },
      {
        "x": 2,
        "z": 1,
        "walls": [
          {
            "type": 1,
            "i": 0
          }
        ],
        "script": "game.gui.box(\n  game.labels.get('fishfound_title'),\n  game.labels.get('fishfound_message'),\n  true\n);"
      },
      {
        "x": 1,
        "z": 1,
        "walls": [],
        "script": ""
      },
      {
        "x": 3,
        "z": 1,
        "walls": [
          {
            "type": 1,
            "i": 0
          }
        ],
        "script": ""
      },
      {
        "x": 2,
        "z": 2,
        "walls": [
          {
            "type": 1,
            "i": 2
          }
        ],
        "script": ""
      },
      {
        "x": 4,
        "z": 2,
        "walls": [],
        "script": ""
      },
      {
        "x": 3,
        "z": 2,
        "walls": [],
        "script": ""
      },
      {
        "x": 2,
        "z": 3,
        "walls": [],
        "script": ""
      },
      {
        "x": 3,
        "z": 3,
        "walls": [],
        "script": ""
      }
    ],
    "seals": [
      {
        "x": 2,
        "z": 2,
        "top": 0.34,
        "left": 0.24,
        "patrol_positions": [
          {
            "x": 2,
            "z": 2,
            "top": 0.69,
            "left": 0.51,
            "patrol_wait": 5000
          }
        ],
        "patrol_loop": true,
        "patrol_wait": 2000,
        "drops": "",
        "rotation": 130
      },
      {
        "x": 3,
        "z": 2,
        "top": 0.36,
        "left": 0.62,
        "patrol_positions": [],
        "patrol_loop": true,
        "patrol_wait": 2000,
        "drops": "",
        "rotation": 245
      }
    ],
    "bears": [],
    "extrawalls": [],
    "end_cell": {
      "x": 3,
      "z": 3
    },
    "next_maze": {
      "x": 2,
      "z": 4
    },
    "pinga": [
      {
        "x": 1,
        "z": 0,
        "top": 0.5,
        "left": 0.45,
        "rotation": 126,
        "script": ""
      }
    ],
    "fish": [
      {
        "x": 2,
        "z": 1,
        "top": 0.46,
        "left": 0.46,
        "rotation": 0,
        "script": ""
      }
    ]
  }
]