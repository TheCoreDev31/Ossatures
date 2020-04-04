export var COLOR_ARRAY = new Array(THREE.Color);
COLOR_ARRAY['bleu_ciel'] = (new THREE.Color(0xc0defc).convertSRGBToLinear());
COLOR_ARRAY['ral7016'] = (new THREE.Color(0x303438).convertSRGBToLinear());
COLOR_ARRAY['blanc'] = (new THREE.Color(0xffffff).convertSRGBToLinear());
COLOR_ARRAY['crepi'] = (new THREE.Color(0xf5f2e6).convertSRGBToLinear());
COLOR_ARRAY['marron'] = (new THREE.Color(0x744b35).convertSRGBToLinear());
COLOR_ARRAY['gris_clair'] = (new THREE.Color(0xb3b7b3).convertSRGBToLinear());
COLOR_ARRAY['vert'] = (new THREE.Color(0x55a06d).convertSRGBToLinear());
COLOR_ARRAY['highlight'] = (new THREE.Color(0xfd6868).convertSRGBToLinear());



// Pour l'affichage des côtes en surimpression
export var textMaterial = new THREE.MeshBasicMaterial({
    color: COLOR_ARRAY['blanc']
});

export function createText(texte) {
    var cotes = new THREE.Mesh();
    var loader = new THREE.FontLoader();
    loader.load('./fonts/helvetiker_regular.typeface.json', function (font) {
        var geometry = new THREE.TextGeometry(texte, {
            font: font,
            size: 2,
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
var boussoleTexture = loader.load("img/boussole.png");
boussoleTexture.encoding = THREE.sRGBEncoding;
export var boussoleMaterial = new THREE.MeshBasicMaterial({
    map: boussoleTexture,
    transparent: true,
    color: COLOR_ARRAY['blanc']
});

// Sol gazonné
var groundTexture = loader.load("img/gazon2.jpg");
groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
groundTexture.repeat.set(50, 50);
groundTexture.encoding = THREE.sRGBEncoding;

export var groundMaterial = new THREE.MeshLambertMaterial({
    map: groundTexture,
    reflectivity: 0.2,
    color: COLOR_ARRAY['vert']
});


// Toit
export function creerToitTexture(repeatX = 1) {
    var roofTexture = new THREE.Texture();
    roofTexture = loader.load("img/ardoise.jpg");
    roofTexture.wrapS = roofTexture.wrapT = THREE.RepeatWrapping;
    roofTexture.repeat.set(5 * repeatX, 5);

    return roofTexture;
}


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


// Porte ou porte-fenêtre ou porte de garage
export var doorMaterial = new THREE.MeshPhongMaterial({
    color: COLOR_ARRAY['ral7016'],
    shininess: 50,
    specular: COLOR_ARRAY['ral7016'],
    refractionRatio: 0.6
});

export var doorMaterial = new THREE.MeshPhongMaterial({
    color: COLOR_ARRAY['ral7016'],
    shininess: 50,
    specular: COLOR_ARRAY['ral7016'],
    refractionRatio: 0.6
});



// Travee
var wallOutTexture = loader.load("img/briques.jpg");
wallOutTexture.wrapS = wallOutTexture.wrapT = THREE.RepeatWrapping;
wallOutTexture.repeat.set(2, 2);
export var wallOutMaterial = new THREE.MeshLambertMaterial({
    map: wallOutTexture,
    color: COLOR_ARRAY['blanc'],
    vertexColors: true
});

var pignonTexture = loader.load("img/briques.jpg");
pignonTexture.wrapS = pignonTexture.wrapT = THREE.RepeatWrapping;
pignonTexture.repeat.set(0.08, 0.08);
export var pignonMaterial = new THREE.MeshLambertMaterial({
    map: pignonTexture,
    color: COLOR_ARRAY['blanc']
});

var floorTexture = loader.load("img/carrelage.jpg");
floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
floorTexture.repeat.set(10, 20);
export var floorMaterial = new THREE.MeshBasicMaterial({
    map: floorTexture,
    reflectivity: 0.3,
    color: COLOR_ARRAY['gris_clair']
});

export var topMaterial = new THREE.MeshBasicMaterial({
    color: COLOR_ARRAY['marron'],
    opacity: 0.7,
    transparent: true
})
