export var COLOR_ARRAY = new Array(THREE.Color);
COLOR_ARRAY['bleu_ciel'] = (new THREE.Color(0xc0dfff).convertSRGBToLinear());
COLOR_ARRAY['ral7016'] = (new THREE.Color(0x303438).convertSRGBToLinear());
COLOR_ARRAY['blanc'] = (new THREE.Color(0xffffff).convertSRGBToLinear());
COLOR_ARRAY['crepi'] = (new THREE.Color(0xf5f2e6).convertSRGBToLinear());
COLOR_ARRAY['marron'] = (new THREE.Color(0x744b35).convertSRGBToLinear());
COLOR_ARRAY['bois'] = (new THREE.Color(0xfce7dc).convertSRGBToLinear());
COLOR_ARRAY['gris_clair'] = (new THREE.Color(0xb3b7b3).convertSRGBToLinear());
COLOR_ARRAY['vert'] = (new THREE.Color(0x55a06d).convertSRGBToLinear());
COLOR_ARRAY['highlight'] = (new THREE.Color(0xfd6868).convertSRGBToLinear());


var textureLoader = new THREE.TextureLoader();


// Pour l'affichage des côtes en surimpression
export var textMaterial = new THREE.MeshBasicMaterial({
    color: COLOR_ARRAY['blanc']
});

export function createText(texte, taillePolice = 2) {
    var cotes = new THREE.Mesh();
    var loader = new THREE.FontLoader();
    loader.load('./fonts/helvetiker_regular.typeface.json', function (font) {
        var geometry = new THREE.TextGeometry(texte, {
            font: font,
            size: taillePolice,
            height: 0.1,
            curveSegments: 4,
            bevelEnabled: false
        });
        cotes.geometry = geometry;
        cotes.geometry.center();
        cotes.material = textMaterial;
    });

    return cotes;
}


// Boussole
var boussoleTexture = textureLoader.load("icons/boussole.png");
boussoleTexture.encoding = THREE.sRGBEncoding;
export var boussoleMaterial = new THREE.MeshBasicMaterial({
    map: boussoleTexture,
    transparent: true,
    color: COLOR_ARRAY['blanc']
});

// Sol gazonné
var groundTexture = textureLoader.load("img/textures/gazon2.jpg");
groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
groundTexture.repeat.set(50, 50);
groundTexture.encoding = THREE.sRGBEncoding;

export var groundMaterial = new THREE.MeshLambertMaterial({
    map: groundTexture,
    reflectivity: 0.2,
    color: COLOR_ARRAY['vert']
});


// Toit
var roofTexture = textureLoader.load("img/textures/ardoise.jpg");
roofTexture.wrapS = roofTexture.wrapT = THREE.RepeatWrapping;
roofTexture.repeat.set(5, 5);
var roofExtMaterial = new THREE.MeshLambertMaterial({
    map: roofTexture,
    color: COLOR_ARRAY['gris_clair']
});
export var roofMaterial = [roofExtMaterial, roofExtMaterial, roofExtMaterial, roofExtMaterial, roofExtMaterial, roofExtMaterial];


// Pour tout type d'ouverture
export var windowMaterial = new THREE.MeshStandardMaterial({
    color: COLOR_ARRAY['ral7016'],
    roughness: 0.4,
    metalness: 0.7,
    side: THREE.DoubleSide
});

// Fenêtre
export var glassMaterial = new THREE.MeshPhongMaterial({
    color: COLOR_ARRAY['bleu_ciel'],
    shininess: 50,
    specular: COLOR_ARRAY['bleu_ciel'],
    refractionRatio: 0.7
    
});

export var selectedGlassMaterial = new THREE.MeshPhongMaterial({
    color: COLOR_ARRAY['highlight'],
    shininess: 20,
    specular: COLOR_ARRAY['highlight'],
    refractionRatio: 0.4
});


// Porte ou porte-fenêtre
export var doorMaterial = new THREE.MeshPhongMaterial({
    color: COLOR_ARRAY['ral7016'],
    shininess: 50,
    specular: COLOR_ARRAY['ral7016'],
    refractionRatio: 0.6
});

export var selectedDoorMaterial = new THREE.MeshPhongMaterial({
    color: COLOR_ARRAY['highlight'],
    shininess: 50,
    specular: COLOR_ARRAY['ral7016'],
    refractionRatio: 0.6
});

// Porte de garage
var garageDoorTexture = new THREE.Texture();
garageDoorTexture = textureLoader.load("img/textures/porte_garage.jpg");
export var garageDoorMaterial = new THREE.MeshLambertMaterial({
    map: garageDoorTexture,
    color: COLOR_ARRAY['ral7016']
});



// Travee
var wallTexture = textureLoader.load("img/textures/briques.jpg");
wallTexture.wrapS = wallTexture.wrapT = THREE.RepeatWrapping;
wallTexture.repeat.set(2, 2);
export var wallMaterial = new THREE.MeshLambertMaterial({
    map: wallTexture,
    color: COLOR_ARRAY['blanc'],
    vertexColors: true
});

var pignonTexture = textureLoader.load("img/textures/briques.jpg");
pignonTexture.wrapS = pignonTexture.wrapT = THREE.RepeatWrapping;
pignonTexture.repeat.set(0.06, 0.08);
var pignonExtMaterial = new THREE.MeshLambertMaterial({
    map: pignonTexture,
    color: COLOR_ARRAY['blanc']
});
export var pignonMaterial = [pignonExtMaterial, pignonExtMaterial];

var floorTexture = textureLoader.load("img/textures/carrelage.jpg");
floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
floorTexture.repeat.set(10, 20);
export var floorMaterial = new THREE.MeshBasicMaterial({
    map: floorTexture,
    reflectivity: 0.3,
    color: COLOR_ARRAY['gris_clair']
});


/****************************************   Armatures bois   *************************************************/

/************************   Planchers  *******************/

var SOLP_Up_Texture = new THREE.Texture();
var SOLP_Down_Texture = new THREE.Texture();
var SOLP_Bump_Texture = new THREE.Texture();
SOLP_Up_Texture = textureLoader.load("img/openings/SOLP_U.png");
SOLP_Down_Texture = textureLoader.load("img/openings/SOLP_D.png");
SOLP_Bump_Texture = textureLoader.load("img/openings/SOLP_D_bump.png");

var SOLP_Up_Material = new THREE.MeshLambertMaterial({
    map: SOLP_Up_Texture,
    vertexColors: true,
    color: COLOR_ARRAY['bois'],
    transparent: true

});
var SOLP_Down_Material = new THREE.MeshStandardMaterial({
    map: SOLP_Down_Texture,
    bumpMap: SOLP_Bump_Texture,
    color: COLOR_ARRAY['bois'],
    transparent: true
});
export var SOLP_Material = [SOLP_Up_Material, SOLP_Up_Material, SOLP_Up_Material, SOLP_Up_Material, SOLP_Up_Material, SOLP_Down_Material];


var SOLE_1_Up_Texture = new THREE.Texture();
var SOLE_1_Down_Texture = new THREE.Texture();
var SOLE_1_Bump_Texture = new THREE.Texture();
SOLE_1_Up_Texture = textureLoader.load("img/openings/SOLE_1_U.png");
SOLE_1_Down_Texture = textureLoader.load("img/openings/SOLE_1_D.png");
SOLE_1_Bump_Texture = textureLoader.load("img/openings/SOLE_1_D_bump.png");
var SOLE_1_Up_Material = new THREE.MeshLambertMaterial({
    map: SOLE_1_Up_Texture,
    vertexColors: true,
    color: COLOR_ARRAY['bois'],
    transparent: true

});
var SOLE_1_Down_Material = new THREE.MeshStandardMaterial({
    map: SOLE_1_Down_Texture,
    bumpMap: SOLE_1_Bump_Texture,
    color: COLOR_ARRAY['bois'],
    transparent: true
});
export var SOLE_1_Material = [SOLE_1_Up_Material, SOLE_1_Up_Material, SOLE_1_Up_Material, SOLE_1_Up_Material, SOLE_1_Up_Material, SOLE_1_Down_Material];


var SOLE_2_Up_Texture = new THREE.Texture();
var SOLE_2_Down_Texture = new THREE.Texture();
var SOLE_2_Bump_Texture = new THREE.Texture();
SOLE_2_Up_Texture = textureLoader.load("img/openings/SOLE_2_U.png");
SOLE_2_Down_Texture = textureLoader.load("img/openings/SOLE_2_D.png");
SOLE_2_Bump_Texture = textureLoader.load("img/openings/SOLE_2_D_bump.png");
var SOLE_2_Up_Material = new THREE.MeshLambertMaterial({
    map: SOLE_2_Up_Texture,
    vertexColors: true,
    color: COLOR_ARRAY['bois'],
    transparent: true

});
var SOLE_2_Down_Material = new THREE.MeshStandardMaterial({
    map: SOLE_2_Down_Texture,
    bumpMap: SOLE_2_Bump_Texture,
    color: COLOR_ARRAY['bois'],
    transparent: true
});
export var SOLE_2_Material = [SOLE_2_Up_Material, SOLE_2_Up_Material, SOLE_2_Up_Material, SOLE_2_Up_Material, SOLE_2_Up_Material, SOLE_2_Down_Material];


var SOLT_Up_Texture = new THREE.Texture();
var SOLT_Down_Texture = new THREE.Texture();
var SOLT_Bump_Texture = new THREE.Texture();
SOLT_Up_Texture = textureLoader.load("img/openings/SOLT_U.png");
SOLT_Down_Texture = textureLoader.load("img/openings/SOLT_D.png");
SOLT_Bump_Texture = textureLoader.load("img/openings/SOLT_D_bump.png");
var SOLT_Up_Material = new THREE.MeshLambertMaterial({
    map: SOLT_Up_Texture,
    vertexColors: true,
    color: COLOR_ARRAY['bois'],

    transparent: true

});
var SOLT_Down_Material = new THREE.MeshStandardMaterial({
    map: SOLT_Down_Texture,
    bumpMap: SOLT_Bump_Texture,
    color: COLOR_ARRAY['bois'],
    transparent: true
});
export var SOLT_Material = [SOLT_Up_Material, SOLT_Up_Material, SOLT_Up_Material, SOLT_Up_Material, SOLT_Up_Material, SOLT_Down_Material];

/************************    Modules   *******************/

/******   Mur plein   ****/
var MPL_Front_Texture = textureLoader.load("img/openings/MPL_F.png");
var MPL_Front_Material = new THREE.MeshLambertMaterial({
    map: MPL_Front_Texture,
    vertexColors: true,
    color: COLOR_ARRAY['bois']
});
var MPL_Back_Texture = textureLoader.load("img/openings/MPL_B.png");
var MPL_Back_Material = new THREE.MeshLambertMaterial({
    map: MPL_Back_Texture,
    vertexColors: true,
    color: COLOR_ARRAY['bois']
});
export var MPL_Material = [MPL_Front_Material, MPL_Front_Material, MPL_Front_Material, MPL_Front_Material, MPL_Back_Material, MPL_Front_Material];

/******   Porte d'entrée   ****/
var MPE_Front_Texture = textureLoader.load("img/openings/MPE_F.png");
var MPE_Front_Material = new THREE.MeshLambertMaterial({
    map: MPE_Front_Texture,
    vertexColors: true,
    color: COLOR_ARRAY['bois'],
    transparent: true
});
var MPE_Back_Texture = textureLoader.load("img/openings/MPE_B.png");
var MPE_Back_Material = new THREE.MeshLambertMaterial({
    map: MPE_Back_Texture,
    vertexColors: true,
    color: COLOR_ARRAY['bois'],
    transparent: true
});
export var MPE_Material = [MPL_Front_Material, MPL_Front_Material, MPL_Front_Material, MPL_Front_Material, MPE_Back_Material, MPE_Front_Material];

/******   Fenêtre de type F1   ****/
var MF1_Front_Texture = textureLoader.load("img/openings/MF1_F.png");
var MF1_Front_Material = new THREE.MeshLambertMaterial({
    map: MF1_Front_Texture,
    vertexColors: true,
    color: COLOR_ARRAY['bois'],
    transparent: true
});
var MF1_Back_Texture = textureLoader.load("img/openings/MF1_B.png");
var MF1_Back_Material = new THREE.MeshLambertMaterial({
    map: MF1_Back_Texture,
    vertexColors: true,
    color: COLOR_ARRAY['bois'],
    transparent: true
});
export var MF1_Material = [MPL_Front_Material, MPL_Front_Material, MPL_Front_Material, MPL_Front_Material, MF1_Back_Material, MF1_Front_Material];

/******   Fenêtre de type F2   ****/
var MF2_Front_Texture = textureLoader.load("img/openings/MF2_F.png");
var MF2_Front_Material = new THREE.MeshLambertMaterial({
    map: MF2_Front_Texture,
    vertexColors: true,
    color: COLOR_ARRAY['bois'],
    transparent: true
});
var MF2_Back_Texture = textureLoader.load("img/openings/MF2_B.png");
var MF2_Back_Material = new THREE.MeshLambertMaterial({
    map: MF2_Back_Texture,
    vertexColors: true,
    color: COLOR_ARRAY['bois'],
    transparent: true
});
export var MF2_Material = [MPL_Front_Material, MPL_Front_Material, MPL_Front_Material, MPL_Front_Material, MF2_Back_Material, MF2_Front_Material];

/******   Combo porte d'entrée + fenêtre F1   ****/
var MPEF_Front_Texture = textureLoader.load("img/openings/MPEF_F.png");
var MPEF_Front_Material = new THREE.MeshLambertMaterial({
    map: MPEF_Front_Texture,
    vertexColors: true,
    color: COLOR_ARRAY['bois'],
    transparent: true
});
var MPEF_Back_Texture = textureLoader.load("img/openings/MPEF_B.png");
var MPEF_Back_Material = new THREE.MeshLambertMaterial({
    map: MPEF_Back_Texture,
    vertexColors: true,
    color: COLOR_ARRAY['bois'],
    transparent: true
});
export var MPEF_Material = [MPL_Front_Material, MPL_Front_Material, MPL_Front_Material, MPL_Front_Material, MPEF_Back_Material, MPEF_Front_Material];

/******   Porte-fenêtre    ****/
var MPF_Front_Texture = textureLoader.load("img/openings/MPF_F.png");
var MPF_Front_Material = new THREE.MeshLambertMaterial({
    map: MPF_Front_Texture,
    vertexColors: true,
    color: COLOR_ARRAY['bois'],
    transparent: true
});
var MPF_Back_Texture = textureLoader.load("img/openings/MPF_B.png");
var MPF_Back_Material = new THREE.MeshLambertMaterial({
    map: MPF_Back_Texture,
    vertexColors: true,
    color: COLOR_ARRAY['bois'],
    transparent: true
});
export var MPF_Material = [MPL_Front_Material, MPL_Front_Material, MPL_Front_Material, MPL_Front_Material, MPF_Back_Material, MPF_Front_Material];

/******   Portique intérieur    ****/
var MPI_Texture = textureLoader.load("img/openings/MPI.png");
MPI_Texture.wrapS = MPI_Texture.wrapT = THREE.RepeatWrapping;
MPI_Texture.repeat.set(0.5, 0.5);
var MPI_Material = new THREE.MeshLambertMaterial({
    map: MPI_Texture,
    vertexColors: true,
    color: COLOR_ARRAY['bois'],
    transparent: true
});
export var MPI_Material = [MPI_Material, MPI_Material, MPI_Material, MPI_Material, MPI_Material, MPI_Material];

/******   Portes de garage    ****/
var MPG1_Front_Texture = textureLoader.load("img/openings/MPG1_F.png");
var MPG1_Front_Material = new THREE.MeshLambertMaterial({
    map: MPG1_Front_Texture,
    vertexColors: true,
    color: COLOR_ARRAY['bois'],
    transparent: true
});
var MPG1_Back_Texture = textureLoader.load("img/openings/MPG1_B.png");
var MPG1_Back_Material = new THREE.MeshLambertMaterial({
    map: MPG1_Back_Texture,
    vertexColors: true,
    transparent: true,
    color: COLOR_ARRAY['bois']
});
export var MPG1_Material = [MPL_Front_Material, MPL_Front_Material, MPL_Front_Material, MPL_Front_Material, MPG1_Back_Material, MPG1_Front_Material];


var MPG2_Front_Texture = textureLoader.load("img/openings/MPG2_F.png");
var MPG2_Front_Material = new THREE.MeshLambertMaterial({
    map: MPG2_Front_Texture,
    vertexColors: true,
    color: COLOR_ARRAY['bois'],
    transparent: true
});
var MPG2_Back_Texture = textureLoader.load("img/openings/MPG2_B.png");
var MPG2_Back_Material = new THREE.MeshLambertMaterial({
    map: MPG2_Back_Texture,
    vertexColors: true,
    transparent: true,
    color: COLOR_ARRAY['bois']
});
export var MPG2_Material = [MPL_Front_Material, MPL_Front_Material, MPL_Front_Material, MPL_Front_Material, MPG2_Back_Material, MPG2_Front_Material];


/*************************    Pignons      *****************************/

var PEXT_Front_Texture = textureLoader.load("img/openings/PEXT_F.png");
PEXT_Front_Texture.wrapS = PEXT_Front_Texture.wrapT = THREE.RepeatWrapping;
PEXT_Front_Texture.repeat.set(0.014, 0.037);
PEXT_Front_Texture.offset.set(0.5, 0);
var PEXT_Front_Material = new THREE.MeshLambertMaterial({
    map: PEXT_Front_Texture,
    vertexColors: true,
    color: COLOR_ARRAY['bois']
});
var PEXT_Back_Texture = textureLoader.load("img/openings/PEXT_B.png");
PEXT_Back_Texture.wrapS = PEXT_Back_Texture.wrapT = THREE.RepeatWrapping;
PEXT_Back_Texture.repeat.set(0.014, 0.037);
PEXT_Back_Texture.offset.set(0.5, 0);
var PEXT_Back_Material = new THREE.MeshLambertMaterial({
    map: PEXT_Back_Texture,
    vertexColors: true,
    color: COLOR_ARRAY['bois']
});
export var PEXT_Material = [PEXT_Front_Material, PEXT_Back_Material];



var PINT_Droite_Front_Texture = textureLoader.load("img/openings/PINT_droite_F.png");
PINT_Droite_Front_Texture.wrapS = PEXT_Front_Texture.wrapT = THREE.RepeatWrapping;
PINT_Droite_Front_Texture.repeat.set(0.014, 0.039);
PINT_Droite_Front_Texture.offset.set(0.5, 0);
var PINT_Droite_Front_Material = new THREE.MeshLambertMaterial({
    map: PINT_Droite_Front_Texture,
    vertexColors: true,
    color: COLOR_ARRAY['bois'],
    transparent: true
});
var PINT_Droite_Back_Texture = textureLoader.load("img/openings/PINT_droite_B.png");
PINT_Droite_Back_Texture.wrapS = PEXT_Back_Texture.wrapT = THREE.RepeatWrapping;
PINT_Droite_Back_Texture.repeat.set(0.014, 0.039);
PINT_Droite_Back_Texture.offset.set(0.5, 0);
var PINT_Droite_Back_Material = new THREE.MeshLambertMaterial({
    map: PINT_Droite_Back_Texture,
    vertexColors: true,
    color: COLOR_ARRAY['bois'],
    transparent: true
});
export var PINT_Droite_Material = [PINT_Droite_Front_Material, PINT_Droite_Back_Material];


var PINT_Gauche_Front_Texture = textureLoader.load("img/openings/PINT_gauche_F.png");
PINT_Gauche_Front_Texture.wrapS = PEXT_Front_Texture.wrapT = THREE.RepeatWrapping;
PINT_Gauche_Front_Texture.repeat.set(0.014, 0.039);
PINT_Gauche_Front_Texture.offset.set(0.5, 0);
var PINT_Gauche_Front_Material = new THREE.MeshLambertMaterial({
    map: PINT_Gauche_Front_Texture,
    vertexColors: true,
    color: COLOR_ARRAY['bois'],
    transparent: true
});
var PINT_Gauche_Back_Texture = textureLoader.load("img/openings/PINT_gauche_B.png");
PINT_Gauche_Back_Texture.wrapS = PEXT_Back_Texture.wrapT = THREE.RepeatWrapping;
PINT_Gauche_Back_Texture.repeat.set(0.014, 0.039);
PINT_Gauche_Back_Texture.offset.set(0.5, 0);
var PINT_Gauche_Back_Material = new THREE.MeshLambertMaterial({
    map: PINT_Gauche_Back_Texture,
    vertexColors: true,
    color: COLOR_ARRAY['bois'],
    transparent: true
});
export var PINT_Gauche_Material = [PINT_Gauche_Front_Material, PINT_Gauche_Back_Material];


/************************   Charpente   *****************************/

var CH1T_Texture = textureLoader.load("img/openings/CH1T.png");
var CH1T_Top_Material = new THREE.MeshLambertMaterial({
    map: CH1T_Texture,
    color: COLOR_ARRAY['bois'],
    transparent: true
});

export var CH1T_Material = [CH1T_Top_Material, CH1T_Top_Material, CH1T_Top_Material, CH1T_Top_Material, CH1T_Top_Material, CH1T_Top_Material];
