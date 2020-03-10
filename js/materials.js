export const COLOR_ARRAY = new Array(THREE.Color);
COLOR_ARRAY['bleu_ciel'] = (new THREE.Color(0xc0defc).convertSRGBToLinear());
COLOR_ARRAY['ral7016'] = (new THREE.Color(0x303438).convertSRGBToLinear());
COLOR_ARRAY['blanc'] = (new THREE.Color(0xffffff).convertSRGBToLinear());
COLOR_ARRAY['crepi'] = (new THREE.Color(0xf7f4e8).convertSRGBToLinear());
COLOR_ARRAY['gris_clair'] = (new THREE.Color(0xb3b7b3).convertSRGBToLinear());
COLOR_ARRAY['highlight'] = (new THREE.Color(0xfd3232).convertSRGBToLinear());


// Sol gazonné
var groundTexture = loader.load("img/gazon.jpg");
groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
groundTexture.repeat.set(50, 100);
groundTexture.encoding = THREE.sRGBEncoding;

export var groundMaterial = new THREE.MeshBasicMaterial({
    map: groundTexture,
    reflectivity: 0.1,
    color: COLOR_ARRAY['gris_clair']
});


// Toit
export function createRoofTexture() {
    var roofTexture = new THREE.Texture();
    roofTexture = loader.load("img/ardoise.jpg");
    roofTexture.wrapS = roofTexture.wrapT = THREE.RepeatWrapping;

    console.log(nbModules);
    roofTexture.repeat.set(6 * (nbModules + 1), 6);

    return roofTexture;
}
