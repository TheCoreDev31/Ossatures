import {
    COLOR_ARRAY,
    creerToitTexture,
    glassMaterial,
    windowMaterial,
    doorMaterial,
    wallMaterial,
    pignonMaterial,
    floorMaterial,
    topMaterial
} from "./materials.js"

import {
    log,
    alerte,
    extraireNomTravee,
    extraireFace,
    supprimerObjetModifiable
} from "./main.js"

import {
    unSelect
} from "./gui.js"


function degrees_to_radians(degrees) {
    var pi = Math.PI;
    return degrees * (pi / 180);
}


export function supprimerToutesOuvertures() {

    objetsModifiables.traverse(function (objet) {

        if (objet.name.match('Ouverture')) {
            supprimerOuverture(objet.name);
        }
    });
}


export function supprimerOuverture(nomObjet) {

    var travee = extraireNomTravee(nomObjet);
    var face = extraireFace(nomObjet);
    var objet = scene.getObjectByName(nomObjet);

    // Il faut supprimer l'objet à l'IHM...
    scene.remove(objet.parent);

    // recalculer les scores VT de la travée concernée...
    tableauTravees[travee]['nb_ouvertures_' + face]--;
    tableauTravees[travee]['vt_' + face] = PRODUITS['MU']['VT'];

    // et enfin, déselectionner l'objet.
    supprimerObjetModifiable(objet.parent.name);
    objetSelectionne = '';
    unSelect();
    if (DEBUG) {
        log('tableauTravee APRES supprimerOuverture :');
        log(tableauTravees);
    }
}

export function creerOuverture(nomTravee, face, typeOuverture, nbPanneaux = 1) {

    var windowGrp = new THREE.Group();
    var largeur, hauteur, epaisseur, elevation;

    // On récupère d'abord les caractéristiques de l'ouverture à créer
    largeur = PRODUITS[typeOuverture]['largeur'];
    hauteur = PRODUITS[typeOuverture]['hauteur'];
    epaisseur = PRODUITS[typeOuverture]['epaisseur'];
    elevation = PRODUITS[typeOuverture]['elevation'];

    // On constitue en premier le chassis
    var windowGeometry = new THREE.Shape();
    windowGeometry.moveTo(0, 0);
    windowGeometry.lineTo(0, hauteur);
    windowGeometry.lineTo(largeur, hauteur);
    windowGeometry.lineTo(largeur, 0);
    windowGeometry.lineTo(0, 0);
    switch (nbPanneaux) {
        case 1:
            var windowHole = new THREE.Shape();
            windowHole.moveTo(.5, .5);
            windowHole.lineTo(.5, hauteur - .5);
            windowHole.lineTo(largeur - .4, hauteur - .5);
            windowHole.lineTo(largeur - .4, .5);
            windowHole.lineTo(.5, .5);
            windowGeometry.holes.push(windowHole);
            break;
        default: // Normalement 2
            var windowHole1 = new THREE.Shape();
            windowHole1.moveTo(.5, .5);
            windowHole1.lineTo(.5, hauteur - .5);
            windowHole1.lineTo((largeur / 2) - .2, hauteur - .5);
            windowHole1.lineTo((largeur / 2) - .2, .5);
            windowHole1.lineTo(.5, .5);
            windowGeometry.holes.push(windowHole1);
            var windowHole2 = new THREE.Shape();
            windowHole2.moveTo((largeur / 2) + .2, 0.5);
            windowHole2.lineTo((largeur / 2) + .2, hauteur - .5);
            windowHole2.lineTo(largeur - .5, hauteur - .5);
            windowHole2.lineTo(largeur - .5, 0.5);
            windowHole2.lineTo((largeur / 2) + .2, 0.5);
            windowGeometry.holes.push(windowHole2);
            break;
    }

    var extrudeSettings = {
        steps: 4,
        depth: epaisseur,
        bevelEnabled: false
    };
    var windowFrame = new THREE.Mesh(new THREE.ExtrudeBufferGeometry(windowGeometry, extrudeSettings), windowMaterial);
    windowFrame.position.set(-(largeur / 2) + .5, -(hauteur / 2) + .5, -(epaisseur / 2));
    windowFrame.name = 'excluded';
    windowGrp.add(windowFrame);


    // Eventuellement, une vitre
    if (typeOuverture == 'F1' || typeOuverture == 'F2' || typeOuverture == 'PF') {
        var windowGlass = new THREE.Mesh(new THREE.BoxGeometry(largeur - 0.5, hauteur - 0.5, EPAISSEUR_MUR + 0.2), glassMaterial);
        windowGlass.position.set(.5, .5, 0);
        windowGlass.name = nomTravee + '>' + face + '>Ouverture ' + typeOuverture + '>Vitre';
        windowGrp.add(windowGlass);
    } else {
        var windowDoor = new THREE.Mesh(new THREE.BoxGeometry(largeur - 0.5, hauteur - 0.5, EPAISSEUR_MUR + 0.2), doorMaterial);
        windowDoor.position.set(.5, .5, 0);
        windowDoor.name = nomTravee + '>' + face + '>Ouverture ' + typeOuverture + '>Porte';
        windowGrp.add(windowDoor);
    }

    windowGrp.name = nomTravee + '>' + face + '>Ouverture ' + typeOuverture;
    objetsModifiables.push(windowGrp);

    var positionX = 0,
        positionY = 0,
        positionZ = 0;
    positionY = -(HAUTEUR_TRAVEE / 2) + (hauteur / 2) + elevation;
    // On calcule la position en fonction du type d'ouverture, de la face de la travée et de la position de la travée.
    switch (face) {
        case 'AV':
            positionX = 0;
            positionZ = (LONGUEUR_TRAVEE / 2) - epaisseur / 2 + 0.5;
            break;
        case 'AR':
            windowGrp.rotation.y = Math.PI;
            positionX = 0;
            positionZ = -(LONGUEUR_TRAVEE / 2) + (epaisseur / 2) - 0.5;
            break;
        case 'PGAV':
            windowGrp.rotation.y = -Math.PI / 2;
            positionX = -(LARGEUR_TRAVEE / 2) + (epaisseur / 2) - 0.5;
            positionZ = (LONGUEUR_TRAVEE / 4);
            break;
        case 'PGAR':
            windowGrp.rotation.y = -Math.PI / 2;
            positionX = -(LARGEUR_TRAVEE / 2) + (epaisseur / 2) - 0.5;
            positionZ = -(LONGUEUR_TRAVEE / 4);
            break;
        case 'PDAV':
            windowGrp.rotation.y = Math.PI / 2;
            positionX = (LARGEUR_TRAVEE / 2) - (epaisseur / 2) + 0.5;
            positionZ = (LONGUEUR_TRAVEE / 4);
            break;
        case 'PDAR':
            windowGrp.rotation.y = Math.PI / 2;
            positionX = (LARGEUR_TRAVEE / 2) - (epaisseur / 2) + 0.5;
            positionZ = -(LONGUEUR_TRAVEE / 4);
            break;
    }
    windowGrp.position.set(positionX, positionY, positionZ);


    // Ne pas oublier de mettre à jour les scores VT de la travée !!!!!
    switch (face) {
        case 'AV':
            if (tableauTravees[nomTravee]['nb_ouvertures_AV'] == 0) tableauTravees[nomTravee]['vt_AV'] = 0;
            tableauTravees[nomTravee]['nb_ouvertures_AV']++;
            tableauTravees[nomTravee]['vt_AV'] += PRODUITS[typeOuverture]['VT'];
            break;
        case 'AR':
            if (tableauTravees[nomTravee]['nb_ouvertures_AR'] == 0) tableauTravees[nomTravee]['vt_AR'] = 0;
            tableauTravees[nomTravee]['nb_ouvertures_AR']++;
            tableauTravees[nomTravee]['vt_AR'] += PRODUITS[typeOuverture]['VT'];
            break;
        case 'PGAV':
            if (tableauTravees[nomTravee]['nb_ouvertures_PGAV'] == 0) tableauTravees[nomTravee]['vt_PGAV'] = 0;
            tableauTravees[nomTravee]['nb_ouvertures_PGAV']++;
            tableauTravees[nomTravee]['vt_PGAV'] += PRODUITS[typeOuverture]['VT'];
            break;
        case 'PGAR':
            if (tableauTravees[nomTravee]['nb_ouvertures_PGAR'] == 0) tableauTravees[nomTravee]['vt_PGAR'] = 0;
            tableauTravees[nomTravee]['nb_ouvertures_PGAR']++;
            tableauTravees[nomTravee]['vt_PGAR'] += PRODUITS[typeOuverture]['VT'];
            break;
        case 'PDAV':
            if (tableauTravees[nomTravee]['nb_ouvertures_PDAV'] == 0) tableauTravees[nomTravee]['vt_PDAV'] = 0;
            tableauTravees[nomTravee]['nb_ouvertures_PDAV']++;
            tableauTravees[nomTravee]['vt_PDAV'] += PRODUITS[typeOuverture]['VT'];
            break;
        case 'PDAR':
            if (tableauTravees[nomTravee]['nb_ouvertures_PDAR'] == 0) tableauTravees[nomTravee]['vt_PDAR'] = 0;
            tableauTravees[nomTravee]['nb_ouvertures_PDAR']++;
            tableauTravees[nomTravee]['vt_PDAR'] += PRODUITS[typeOuverture]['VT'];
            break;
    }
    if (DEBUG) {
        log('tableauTravee APRES creerOuverture :');
        log(tableauTravees);
    }
    return windowGrp;
}



export function creerToit(nomTravee) {
    var roofGrp = new THREE.Group();
    var texture = creerToitTexture();
    var frontPan = new THREE.Mesh(new THREE.BoxBufferGeometry(LARGEUR_TRAVEE, LARGEUR_TRAVEE * 1.256, 0.2), new THREE.MeshLambertMaterial({
        map: texture,
        color: COLOR_ARRAY['gris_clair']
    }));
    frontPan.position.set(0, HAUTEUR_TRAVEE, (LONGUEUR_TRAVEE / 2) - 17.5);
    frontPan.rotateX(-degrees_to_radians(55));
    frontPan.castShadow = true;
    frontPan.name = 'excluded';
    roofGrp.add(frontPan);

    var rearPan = frontPan.clone();
    rearPan.rotateX(2 * degrees_to_radians(55));
    rearPan.position.set(0, HAUTEUR_TRAVEE, -(LONGUEUR_TRAVEE / 2) + 17.5);
    rearPan.castShadow = true;
    rearPan.name = 'excluded';
    roofGrp.add(rearPan);

    var pignonGeometry = new THREE.Shape();
    pignonGeometry.moveTo(-LONGUEUR_TRAVEE / 2, 0);
    pignonGeometry.lineTo(0, (LONGUEUR_TRAVEE / 2) * 0.71, 0);
    pignonGeometry.lineTo(LONGUEUR_TRAVEE / 2, 0, 0);
    pignonGeometry.lineTo(0, 0);
    var extrudeSettings = {
        depth: EPAISSEUR_MUR,
        bevelEnabled: false
    };
    var leftPignon = new THREE.Mesh(new THREE.ExtrudeBufferGeometry(pignonGeometry, extrudeSettings), pignonMaterial);
    leftPignon.rotation.y = Math.PI / 2;
    leftPignon.position.set(-(LARGEUR_TRAVEE / 2), (HAUTEUR_TRAVEE / 2), 0);
    leftPignon.name = 'excluded';
    roofGrp.add(leftPignon);
    var rightPignon = leftPignon.clone()
    rightPignon.position.x = (LARGEUR_TRAVEE / 2) - EPAISSEUR_MUR;
    roofGrp.add(rightPignon);

    roofGrp.name = nomTravee + '>Toit';
    return roofGrp;
}



export function creerTravee() {

    var prefixe = 'Travee ' + (nbTravees + 1);

    if ((nbTravees + 1) == 1) {
        nbConstructions = 1;
        tableauConstructions['Construction ' + nbConstructions] = new Array();
        tableauConstructions['Construction ' + nbConstructions].push(prefixe);
    } else {

        // On compare par rapport à la travée de gauche, pour vérifier s'il existe un décalage avec celle-ci
        var traveeGauche = 'Travee ' + nbTravees;
        if (tableauTravees[traveeGauche]) {
            if (tableauTravees[traveeGauche]['decalee'] != 0) {
                nbConstructions++;
                if (nbConstructions <= NBCONSTRUCTIONSMAXI) {
                    tableauConstructions['Construction ' + nbConstructions] = new Array();
                    tableauConstructions['Construction ' + nbConstructions].push(prefixe);
                } else {
                    alerte("Vous avez atteint le nombre maximal de constructions autorisées (" + NBCONSTRUCTIONSMAXI + ").");
                    return;
                }
            } else {

                // Même construction, rajout de la travée
                tableauConstructions['Construction ' + nbConstructions].push(prefixe);

                for (var i = 1; i < tableauConstructions.length; i++) {
                    if (tableauConstructions[i].includes(traveeGauche)) {
                        tableauConstructions[i].push(prefixe);
                        break;
                    }
                }
            }
        }
    }
    log('tableauConstructions = ');
    log(tableauConstructions);


    // Un module = 6 murs (AV + AR + 2 par pignon) + un sol + un plafond
    // IMPORTANT : on crée les murs avec la face AV devant.
    var wallAR = new THREE.Mesh(new THREE.BoxGeometry(LARGEUR_TRAVEE, HAUTEUR_TRAVEE, EPAISSEUR_MUR), wallMaterial);
    wallAR.position.z = -LARGEUR_TRAVEE + (EPAISSEUR_MUR / 2);

    var wallPDAR = new THREE.Mesh(new THREE.BoxGeometry(LONGUEUR_TRAVEE / 2 - EPAISSEUR_MUR, HAUTEUR_TRAVEE, EPAISSEUR_MUR), wallMaterial);
    wallPDAR.rotation.y = -Math.PI / 2;
    wallPDAR.position.x = ((-EPAISSEUR_MUR / 2) + LARGEUR_TRAVEE / 2) - 0.01;
    wallPDAR.position.z = -(LONGUEUR_TRAVEE / 4) + EPAISSEUR_MUR / 2;

    var wallPDAV = new THREE.Mesh(new THREE.BoxGeometry(LONGUEUR_TRAVEE / 2 - EPAISSEUR_MUR, HAUTEUR_TRAVEE, EPAISSEUR_MUR), wallMaterial);
    wallPDAV.rotation.y = -Math.PI / 2;
    wallPDAV.position.x = (-EPAISSEUR_MUR / 2) + LARGEUR_TRAVEE / 2;
    wallPDAV.position.z = (LONGUEUR_TRAVEE / 4) - EPAISSEUR_MUR / 2;

    var wallAV = new THREE.Mesh(new THREE.BoxGeometry(LARGEUR_TRAVEE, HAUTEUR_TRAVEE, EPAISSEUR_MUR), wallMaterial);
    wallAV.rotation.y = Math.PI;
    wallAV.position.z = LARGEUR_TRAVEE - (EPAISSEUR_MUR / 2);

    var wallPGAV = new THREE.Mesh(new THREE.BoxGeometry(LONGUEUR_TRAVEE / 2 - EPAISSEUR_MUR, HAUTEUR_TRAVEE, EPAISSEUR_MUR), wallMaterial);
    wallPGAV.rotation.y = Math.PI / 2;
    wallPGAV.position.x = (EPAISSEUR_MUR / 2) - LARGEUR_TRAVEE / 2;
    wallPGAV.position.z = (LONGUEUR_TRAVEE / 4) - EPAISSEUR_MUR / 2;

    var wallPGAR = new THREE.Mesh(new THREE.BoxGeometry(LONGUEUR_TRAVEE / 2 - EPAISSEUR_MUR, HAUTEUR_TRAVEE, EPAISSEUR_MUR), wallMaterial);
    wallPGAR.rotation.y = Math.PI / 2;
    wallPGAR.position.x = (EPAISSEUR_MUR / 2) - LARGEUR_TRAVEE / 2;
    wallPGAR.position.z = -(LONGUEUR_TRAVEE / 4) + EPAISSEUR_MUR / 2;

    var floor = new THREE.Mesh(new THREE.PlaneBufferGeometry(LARGEUR_TRAVEE, LONGUEUR_TRAVEE), floorMaterial);
    floor.position.set(0, (-HAUTEUR_TRAVEE / 2) + .01, 0);
    floor.rotation.x = -Math.PI / 2;

    var top = new THREE.Mesh(new THREE.PlaneBufferGeometry(LARGEUR_TRAVEE, LONGUEUR_TRAVEE), topMaterial);
    top.rotation.x = -Math.PI / 2;
    top.position.set(0, (HAUTEUR_TRAVEE / 2) + .01, 0);
    top.visible = false;

    var wallsGrp = new THREE.Group();
    nbTravees++;
    wallsGrp.add(wallAR);
    wallAR.name = prefixe + '>AR';
    wallsGrp.add(wallPDAR);
    wallPDAR.name = prefixe + '>PDAR';
    wallsGrp.add(wallPDAV);
    wallPDAV.name = prefixe + '>PDAV';
    wallsGrp.add(wallAV);
    wallAV.name = prefixe + '>AV';
    wallsGrp.add(wallPGAV);
    wallPGAV.name = prefixe + '>PGAV';
    wallsGrp.add(wallPGAR);
    wallPGAR.name = prefixe + '>PGAR';
    floor.name = 'excluded';
    wallsGrp.add(floor);
    top.name = 'excluded';
    wallsGrp.add(top);
    wallsGrp.name = prefixe;
    objetsModifiables.push(wallsGrp);

    for (var i = 0; i < wallsGrp.children.length; i++) {
        wallsGrp.children[i].receiveShadow = false;
        wallsGrp.children[i].castShadow = true;
    }

    // Initialisation du tableau d'infos sur la travée que l'on vient de créer...
    var vtMur = PRODUITS['MU']['VT'];
    tableauTravees['Travee ' + nbTravees] = new Array();
    tableauTravees['Travee ' + nbTravees]['nom'] = wallsGrp.name;
    tableauTravees['Travee ' + nbTravees]['decalee'] = 0;
    tableauTravees['Travee ' + nbTravees]['nb_ouvertures_AR'] = 0;
    tableauTravees['Travee ' + nbTravees]['vt_AR'] = vtMur;
    tableauTravees['Travee ' + nbTravees]['nb_ouvertures_PDAR'] = 0;
    tableauTravees['Travee ' + nbTravees]['vt_PDAR'] = vtMur;
    tableauTravees['Travee ' + nbTravees]['nb_ouvertures_PDAV'] = 0;
    tableauTravees['Travee ' + nbTravees]['vt_PDAV'] = vtMur;
    tableauTravees['Travee ' + nbTravees]['nb_ouvertures_AV'] = 0;
    tableauTravees['Travee ' + nbTravees]['vt_AV'] = vtMur;
    tableauTravees['Travee ' + nbTravees]['nb_ouvertures_PGAV'] = 0;
    tableauTravees['Travee ' + nbTravees]['vt_PGAV'] = vtMur;
    tableauTravees['Travee ' + nbTravees]['nb_ouvertures_PGAR'] = 0;
    tableauTravees['Travee ' + nbTravees]['vt_PGAR'] = vtMur;

    // .. ne pas oublier que cela modifie les scores VT des travées adjacentes.


    var toit = creerToit(prefixe);
    wallsGrp.add(toit);


    return wallsGrp;
}



export function deplacerTravee(nomTravee, direction) {

    if (nbTravees <= 1) {
        alerte("Vous devez avoir plus d'une travée dans votre projet.");
        return;
    }

    if (DEBUG) log('Direction demandée = ' + direction + ' - Décalage actuel = ' + tableauTravees[nomTravee]['decalee']);

    if ((direction == 'front' && tableauTravees[nomTravee]['decalee'] == 1) ||
        (direction == 'back' && tableauTravees[nomTravee]['decalee'] == -1)) {
        alerte("Travée déjà décalée dans cette direction.");
        return;
    }

    var travee = scene.getObjectByName(nomTravee);
    var numTravee = parseInt(nomTravee.substr(nomTravee.indexOf(' ') + 1, 2));
    var nomTraveeGauche = nomTravee.substr(0, nomTravee.indexOf(' ') + 1) + (numTravee - 1);
    var nomTraveeDroite = nomTravee.substr(0, nomTravee.indexOf(' ') + 1) + (numTravee + 1);

    var traveeGauche = scene.getObjectByName(nomTraveeGauche);
    var traveeDroite = scene.getObjectByName(nomTraveeDroite);

    if (direction == 'front') {
        // décalage vers l'avant

        // On masque certains murs de la travée courante et également des travées adjacentes.
        if (traveeGauche) {
            var decalageTraveeGauche = tableauTravees[nomTraveeGauche]['decalee'];
            if (Math.abs(decalageTraveeGauche - (tableauTravees[nomTravee]['decalee'] + 1)) > 1) {
                alerte("Impossible de réaliser un tel décalage.");
                return;
            } else {
                travee.children[indicePGAV].visible = true;
                travee.children[indicePGAR].visible = false;
                traveeGauche.children[indicePDAV].visible = false;
                traveeGauche.children[indicePDAR].visible = true;
            }
        }

        if (traveeDroite) {
            var decalageTraveeDroite = tableauTravees[nomTraveeDroite]['decalee'];
            if (Math.abs(decalageTraveeDroite - (tableauTravees[nomTravee]['decalee'] + 1)) > 1) {
                alerte("Impossible de réaliser un tel décalage.");
                return;
            } else {
                travee.children[indicePDAV].visible = true;
                travee.children[indicePDAR].visible = false;
                traveeDroite.children[indicePGAV].visible = false;
                traveeDroite.children[indicePGAR].visible = true;
            }
        }

        travee.position.z += (LONGUEUR_TRAVEE / 2);
        tableauTravees[nomTravee]['decalee']++;

    } else { // décalage vers le fond

        // On masque certains murs de la travée courante et également des travées adjacentes.
        if (traveeGauche) {
            var decalageTraveeGauche = tableauTravees[nomTraveeGauche]['decalee'];
            if (Math.abs(decalageTraveeGauche - (tableauTravees[nomTravee]['decalee'] - 1)) > 1) {
                alerte("Impossible de réaliser un tel décalage.");
                return;
            } else {
                travee.children[indicePGAV].visible = false;
                travee.children[indicePGAR].visible = true;
                traveeGauche.children[indicePDAV].visible = true;
                traveeGauche.children[indicePDAR].visible = false;
            }
        }

        if (traveeDroite) {
            var decalageTraveeDroite = tableauTravees[nomTraveeDroite]['decalee'];
            if (Math.abs(decalageTraveeDroite - (tableauTravees[nomTravee]['decalee'] - 1)) > 1) {
                alerte("Impossible de réaliser un tel décalage.");
                return;
            } else {
                travee.children[indicePDAV].visible = false;
                travee.children[indicePDAR].visible = true;
                traveeDroite.children[indicePGAV].visible = true;
                traveeDroite.children[indicePGAR].visible = false;
            }
        }

        travee.position.z -= (LONGUEUR_TRAVEE / 2);
        tableauTravees[nomTravee]['decalee']--;

    }
    unSelect();
}
