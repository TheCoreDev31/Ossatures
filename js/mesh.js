/*export function buildModule() {
    var group = new THREE.Group();

    // Un module = 4 murs + un sol
    var wallGeometry = new THREE.BoxGeometry(2, 25, 72);
    var wallTexture = loader.load("img/crepi.jpg");
    var wallMaterial = new THREE.MeshStandardMaterial({
        map: wallTexture
    });
    var wallLeft = new THREE.Mesh(wallGeometry, wallMaterial);
    wallLeft.receiveShadow = false;
    wallLeft.castShadow = true;
    wallLeft.position.x = -18;

    var wallRight = wallLeft.clone();
    wallRight.position.x = 18;

    var wallFront = new THREE.Mesh(new THREE.BoxGeometry(38, 25, 2), wallMaterial);
    wallFront.receiveShadow = false;
    wallFront.castShadow = true;
    wallFront.position.set(0, 0, 36);

    var wallBack = wallFront.clone();
    wallBack.position.z = -36;

    var floorTexture = loader.load("img/carrelage.jpg");
    floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat.set(10, 20);
    var floorMaterial = new THREE.MeshStandardMaterial({
        map: floorTexture
    });
    var floor = new THREE.Mesh(new THREE.BoxGeometry(36, 0.1, 72), floorMaterial);
    floor.position.set(0, -12.5, 0);
    floor.receiveShadow = true;
    floor.castShadow = true;

    group.add(wallLeft);
    group.add(wallRight);
    group.add(wallFront);
    group.add(wallBack);
    group.add(floor);

    return group;
}
*/
