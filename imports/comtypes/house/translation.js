/* eslint-disable quotes, quote-props, comma-dangle */

export const HouseTranslation = {

  en:
  {
    "community": "building",
    "Join a community": "Join a building",
    "Create a community": "Create a building",
    "Community finder note": "If you create a new building, you will be its Administrator.",
    "Community finder text": ["Here you can see the houses created in our system that receive new members. ",
       "If you find your house in the list and are not yet a member of the community, you can submit a request to join on the house page, which can be approved by the house's executives. ",
       "If your house is not already in your system, you can create it and invite your housemates to join."],

    "flat": "Apartment",
    "parking": "Parking",
    "storage": "Storage",
    "cellar": "Cellar",
    "attic": "Attic",
    "shop": "Shop",
    "other": "Other",
    "centralHeating": "Central heating",
    "ownHeating": "Own heating system",

    "schemaCommunities": {
      "name": {
        "label": "Name of the Building",
        "placeholder": "(eg. Marina Gardens)"
      },
      "description": {
        "label": "Description",
        "placeholder": "(eg. The most colourful building in the street.)"
      },
      "avatar": {
        "label": "Image",
        "placeholder": "Can use existing link (eg. https://imgbb.com/pic.jpg)"
      },
      "zip": {
        "label": "Zip code",
        "placeholder": "(eg. 1089)"
      },
      "city": {
        "label": "City",
        "placeholder": "(eg. Budapest)"
      },
      "street": {
        "label": "Street",
        "placeholder": "(eg. Tulip street or Heros square)"
      },
      "number": {
        "label": "House number",
        "placeholder": "(eg. 101 or 25/B)"
      },
      "lot": {
        "label": "Lot number",
        "placeholder": "(eg. 29732/9)"
      },
      "parcelRefFormat": {
        "label": "Parcel ref format",
        "placeholder": "(eg. F/D means Floor/Door)"
      },
      "management": {
        "label": "Contact info of management",
        "placeholder": "(eg. office address, phone, opening hours)"
      },
      "taxNumber": {
        "label": "Tax number",
        "placeholder": "(VAT number to appear on invoices)"
      },
      "totalunits": {
        "label": "Total shares outstanding",
        "placeholder": "(eg. 10000)"
      },
      "settings": {
        "label": "Settings",
        "joinable": {
          "label": "Accepts join requests"
        },
        "accountingMethod": {
          "label": "Accounting method",
          "accrual": "Accrual",
          "cash": 'Cash'
        }
      },
      "bankAccounts": {
        "label": "Bank accounts",
        "$": {
          "name": {
            "label": "Name",
            "placeholder": "(eg. Savings account)"
          },
          "number": {
            "label": "Bank account number",
            "placeholder": "(eg 12345678-00000000-00000525)"
          },
          "protocol": {
            "label": "Synchronization protocol (if available)",
            "auto": "Automatic",
            "manual": "Manual"
          },
          "primary": {
            "label": "Primary"
          }
        }
      }
    },
    "schemaParcels": {
      "label": "Parcel",
      "serial": {
        "label": "Serial no.",
        "placeholder": "(eg. 34)"
      },
      "ref": {
        "label": "Parcel",
        "placeholder": "(eg. P114)"
      },
      "leadRef": {
        "label": "Lead parcel",
        "placeholder": "(eg. K108)"
      },
      "units": {
        "label": "Voting share units",
        "placeholder": "(eg. 135)"
      },
      "building": {
        "label": "Building",
        "placeholder": "(eg. F)"
      },
      "floor": {
        "label": "Floor",
        "placeholder": "(eg. 4 or IV)"
      },
      "door": {
        "label": "Door",
        "placeholder": "24"
      },
      "type": {
        "label": "Type",
        "placeholder": "(eg. Apartment)"
      },
      "lot": {
        "label": "Lot No.",
        "placeholder": "(eg. 293457/A/21)"
      },
      "location": {
        "label": "Location"
      },
      "area": {
        "label": "Area (m2)",
        "placeholder": "(eg. 45)"
      },
      "volume": {
        "label": "Volume (m3)",
        "placeholder": "(eg. 142)"
      },
      "habitants": {
        "label": "Number of habitants",
        "placeholder": "(eg. 3)"
      },
      "freeFields": {
        "label": "Free fields",
        "$": {
          "key": {
            "label": "Field name",
            "placeholder": "(pl. Height)"
          },
          "value": {
            "label": "Field value",
            "placeholder": "(eg. 3.5m)"
          }
        }
      }
    }
  },

  hu:
  {
    "community": "ház",
    "Community finder": "Házkereső",
    "Join a community": "Csatlakozás egy házhoz",
    "Create a community": "Létrehozok egy házat",
    "Community finder note": "Ha létrehoz egy új közösséget, ön lesz az Adminisztrátor!",
    "Community finder text": ["Itt láthatja azokat a rendszerünkben létrehozott házakat, melyek fogadnak még új tagokat. ",
      "Ha megtalálja saját házát a listában és még nem tagja a közösségnek, a ház adatlapján csatlakozási kérelmet adhat be, melyet a ház vezetői hagyhatnak jóvá. ",
      "Ha a háza még nem található meg a rendszerben, akkor létrehozhatja azt és meghívhatja lakótársait is, hogy csatlakozzanak."],

    "Parcels of community": "A házhoz tartozó albetétek",
    "Community page": "Házlap",

    "flat": "Lakás",
    "parking": "Parkoló",
    "storage": "Tároló",
    "cellar": "Pince",
    "attic": "Padlás",
    "shop": "Üzlet",
    "other": "Egyéb",
    "centralHeating": "Központi fűtés",
    "ownHeating": "Saját fűtés",

    "ownership proportion": "tulajdoni hányad",

    "schemaCommunities": {
      "name": {
        "label": "Társasház neve",
        "placeholder": "(pl. Rózsakert lakópark vagy Kankalin u 45)"
      },
      "description": {
        "label": "Leírás",
        "placeholder": "(pl. Az utca legszínesebb háza.)"
      },
      "avatar": {
        "label": "Fénykép",
        "placeholder": "Link megadása (pl. https://imgbb.com/kajol-lak.jpg)"
      },
      "zip": {
        "label": "Irányító szám",
        "placeholder": "(pl. 1034)"
      },
      "city": {
        "label": "Város",
        "placeholder": "(pl. Budapest)"
      },
      "street": {
        "label": "Utca/közterület",
        "placeholder": "(pl. Kankalin u. vagy Zsigmond tér)"
      },
      "number": {
        "label": "Házszám",
        "placeholder": "(pl. 101 vagy 25/B)"
      },
      "lot": {
        "label": "Helyrajzi szám",
        "placeholder": "(pl. 29732/9)"
      },
      "parcelRefFormat": {
        "label": "Albetét azonosító formátuma",
        "placeholder": "(pl. F/D azt jelenti Emelet/Ajto)"
      },
      "totalunits": {
        "label": "Összes tulajdoni hányad",
        "placeholder": "(pl. 1000 vagy 9999)"
      },
      "management": {
        "label": "Közös képviselet elérhetősége",
        "placeholder": "(pl. iroda címe, telefonszáma, nyitvatartása)"
      },
      "taxNumber": {
        "label": "Adószám",
        "placeholder": "(ahogy a számlákon megjelenjen)"
      },
      "settings": {
        "label": "Beállítások",
        "joinable": {
          "label": "Csatlakozási kérelmeket fogad"
        },
        "accountingMethod": {
          "label": "Könyvelési mód",
          "accrual": "Kettős könyvitel",
          "cash": "Egyszeres (pénzforgalmi) könyvitel"
        }
      },
      "bankAccounts": {
        "label": "Bank számlák",
        "$": {
          "name": {
            "label": "Elnevezése",
            "placeholder": "(pl. Megtakarítási számla)"
          },
          "number": {
            "label": "Bankszámlaszám",
            "placeholder": "(pl. 12345678-00000000-00000525)"
          },
          "protocol": {
            "label": "Szinkronizációs protokol a bankkal (ha van)",
            "auto": "Automatikus",
            "manual": "Manuális"
          },
          "primary": {
            "label": "Elsődleges"
          }
        }
      }
    },
    "schemaParcels": {
      "label": "Albetét",
      "serial": {
        "label": "Sorszám",
        "placeholder": "(pl. 34)"
      },
      "ref": {
        "label": "Albetét",
        "placeholder": "(pl. P114)"
      },
      "leadRef": {
        "label": "Vezető albetét",
        "placeholder": "(pl. K108)"
      },
      "units": {
        "label": "Tulajdoni hányad",
        "placeholder": "(pl. 135)"
      },
      "building": {
        "label": "Épület",
        "placeholder": "(pl. K)"
      },
      "floor": {
        "label": "Emelet",
        "placeholder": "(pl. 4 vagy IV)"
      },
      "door": {
        "label": "Ajtó",
        "placeholder": "(pl. 24)"
      },
      "type": {
        "label": "Típus",
        "placeholder": "(pl. Lakás)"
      },
      "lot": {
        "label": "Helyrajzi szám",
        "placeholder": "(pl. 293456/A/24)"
      },
      "location": {
        "label": "Elhelyezkedés"
      },
      "area": {
        "label": "Alapterület (m2)",
        "placeholder": "(pl. 45)"
      },
      "volume": {
        "label": "Légköbméter (m3)",
        "placeholder": "(pl. 142)"
      },
      "habitants": {
        "label": "Lakók száma",
        "placeholder": "(pl. 3)"
      },
      "freeFields": {
        "label": "Kötetlen mezők",
        "$": {
          "key": {
            "label": "Megnevezés",
            "placeholder": "(pl. Belmagasság)"
          },
          "value": {
            "label": "Érték",
            "placeholder": "(pl. 3,5m)"
          }
        }
      }
    }
  }
};
