import {
    COLOR_ARRAY,
    creerToitTexture,
    glassMaterial,
    windowMaterial,
    doorMaterial,
    garageDoorMaterial,
    wallOutMaterial,
    pignonMaterial,
    floorMaterial,
    topMaterial,
    createText
} from "./materials.js"

import {
    log,
    alerte,
    extraireNomTravee,
    extraireFace,
    retirerObjetModifiable,
    initialiserScoresVT,
    recalculerConstructions,
    supprimerObjetDunGroupe
} from "./main.js"

import {
    unSelect
} from "./gui.js"



function degrees_to_radians(degrees) {
    var pi = Math.PI;
    return degrees * (pi / 180);
}


export function supprimerToutesOuvertures() {

    var nbObjets = objetsModifiables.length;

    var aSupprimer = new Array();
    for (var i = 0; i < nbObjets; i++) {
        if (objetsModifiables[i].name.includes('Ouverture')) {
            aSupprimer.push(objetsModifiables[i].name);
        }
    }
    for (var i = 0; i < aSupprimer.length; i++) {
        supprimerOuverture(aSupprimer[i]);
    }
}

export function supprimerOuverture(nomObjet) {

    var travee = extraireNomTravee(nomObjet);
    var face = extraireFace(nomObjet);
    var objet = scene.getObjectByName(nomObjet);

    // Pour le cas particulier du portique intérieur, on raffiche la cloison précédemment masquée.
    if (nomObjet.includes("PO")) {
        var portique = scene.getObjectByName(extraireNomTravee(nomObjet) + ">" + extraireFace(nomObjet));
        portique.visible = true;
    }

    // Il faut supprimer l'objet à l'IHM, ainsi que sa référence dans l'incrustation ...
    scene.remove(objet);
    nbOuvertures--;

    var newInscrustationModules = new THREE.Group();
    newInscrustationModules = supprimerObjetDunGroupe(incrustationModules, nomObjet + ">Incrustation");
    incrustationModules = newInscrustationModules;

    // recalculer les scores VT de la travée concernée...
    tableauTravees[travee]['nb_ouvertures_' + face]--;
    tableauTravees[travee]['vt_' + face] = PRODUITS['MU']['VT'];

    // et enfin, déselectionner l'objet.
    retirerObjetModifiable(objet.name);
    objetSelectionne = '';
    unSelect();
    if (DEBUG) {
        log('tableauTravee APRES supprimerOuverture :');
        log(tableauTravees);
    }
}

export function creerOuverture(nomTravee, face, typeOuverture) {

    var windowGrp = new THREE.Group();
    var largeur, hauteur, epaisseur, elevation;
    var nbPanneaux = 1;
    var murInterieur = false;

    // On récupère d'abord les caractéristiques de l'ouverture à créer
    largeur = PRODUITS[typeOuverture]['largeur'];
    hauteur = PRODUITS[typeOuverture]['hauteur'];
    elevation = PRODUITS[typeOuverture]['elevation'];
    epaisseur = PRODUITS[typeOuverture]['epaisseur'];

    var dernierRang = 2;
    if ((face.includes('PG') && tableauTravees[nomTravee]['rangDansConstruction'] != 1) ||
        (face.includes('PD') && tableauTravees[nomTravee]['rangDansConstruction'] != dernierRang)) {
        murInterieur = true;
    }

    // Le portique intérieur est un cas bien particulier : on supprime la cloison et on la remplace pour une ouverture ayant le même matériel qu'un mur.
    if (typeOuverture == 'PO') {
        var facade = scene.getObjectByName(nomTravee + ">" + face);
        facade.visible = false;
        var portionMur = new THREE.Mesh(new THREE.BoxGeometry((LONGUEUR_TRAVEE / 2), 4, EPAISSEUR_MUR), wallOutMaterial);
        portionMur.name = nomTravee + '>' + face + '>Ouverture ' + typeOuverture + '>Portique';
        windowGrp.add(portionMur);

    } else { // Ouvertures "classiques"

        if (typeOuverture === 'F2' || typeOuverture === 'PF') nbPanneaux = 2;

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
            if (typeOuverture == 'PG')
                var windowDoor = new THREE.Mesh(new THREE.BoxGeometry(largeur - 0.5, hauteur - 0.5, EPAISSEUR_MUR + 0.2), garageDoorMaterial);
            else
                var windowDoor = new THREE.Mesh(new THREE.BoxGeometry(largeur - 0.5, hauteur - 0.5, EPAISSEUR_MUR + 0.2), doorMaterial);
            windowDoor.position.set(.5, .5, 0);
            windowDoor.name = nomTravee + '>' + face + '>Ouverture ' + typeOuverture + '>Porte';
            windowGrp.add(windowDoor);
        }
    }

    windowGrp.name = nomTravee + '>' + face + '>Ouverture ' + typeOuverture;
    objetsModifiables.push(windowGrp);

    var positionX = 0,
        positionY = 0,
        positionZ = 0;
    positionY = -(HAUTEUR_TRAVEE / 2) + (hauteur / 2) + elevation;
    // On calcule la position en fonction du type d'ouverture, de la face de la travée et de la position de la travée.
    // Pour rappel, l'ouverture est créée face à soi.
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

    positionX += tableauTravees[nomTravee]['positionX'];
    positionZ += tableauTravees[nomTravee]['positionZ'];
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
    nbOuvertures++;

    // Pour l'affichage en vue aérienne, on rajoute au sol la description du module, masquée par défaut.
    var decalageIncrustationX = 0,
        decalageIncrustationZ = 0;
    var incrustation = createText(PRODUITS[typeOuverture]['codeModule'], taillePoliceIncrustations);
    incrustation.rotation.x = -Math.PI / 2;
    switch (face) {
        case "AV":
            decalageIncrustationZ = 10;
            break;
        case "AR":
            decalageIncrustationZ = -10;
            break;
        case "PGAV":
            decalageIncrustationX = -10;
            break;
        case "PDAV":
            decalageIncrustationX = 10;
            break;
        case "PGAR":
            decalageIncrustationX = -10;
            break;
        case "PDAR":
            decalageIncrustationX = 10;
            break;
    }
    incrustation.position.set(positionX + decalageIncrustationX, -(HAUTEUR_TRAVEE / 2), positionZ + decalageIncrustationZ);
    incrustation.name = nomTravee + '>' + face + '>Ouverture ' + typeOuverture + ">Incrustation";
    incrustationModules.add(incrustation);

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


export function decalerTravee(nomTravee, direction) {

    if (nbTravees <= 1) {
        alerte("Vous devez avoir plus d'une travée dans votre projet.");
        return;
    }

    if (DEBUG) log('Direction demandée = ' + direction + ' - Décalage actuel = ' + tableauTravees[nomTravee]['decalage']);

    if ((direction == 'front' && tableauTravees[nomTravee]['decalage'] == 1) ||
        (direction == 'back' && tableauTravees[nomTravee]['decalage'] == -1)) {
        alerte("Travée déjà décalée dans cette direction.");
        return;
    }

    if (nbOuvertures > 0) {
        if (!confirm("Vous allez perdre toutes les ouvertures déjà créées. Continuer ?")) return;
        supprimerToutesOuvertures();
    }

    var travee = scene.getObjectByName(nomTravee);
    var numTravee = parseInt(nomTravee.substr(nomTravee.indexOf(' ') + 1, 2));
    var nomTraveeGauche = nomTravee.substr(0, nomTravee.indexOf(' ') + 1) + (numTravee - 1);
    var nomTraveeDroite = nomTravee.substr(0, nomTravee.indexOf(' ') + 1) + (numTravee + 1);

    var traveeGauche = scene.getObjectByName(nomTraveeGauche);
    var traveeDroite = scene.getObjectByName(nomTraveeDroite);

    // Si ce décalage déclenche la création d'une 3° construction, alors stop.
    // On simule le recalcul des constructions...
    var tableauDecalages = [];
    for (var item in tableauTravees) {
        if (tableauTravees.hasOwnProperty(item)) {
            var laTravee = tableauTravees[item];
            tableauDecalages.push(laTravee['decalage']);
        }
    }

    if (direction == 'front') { // décalage vers l'avant

        tableauDecalages[numTravee - 1] += 1;
        var nbConstructionSimule = recalculerConstructions(tableauDecalages);
        if (nbConstructionSimule > NB_CONSTRUCTIONS_MAXI) {
            alerte("Décalage refusé : vous avez atteint le nombre maximum de constructions autorisées (" + NB_CONSTRUCTIONS_MAXI + ").");
            return;
        }

        // On masque certains murs de la travée courante et également des travées adjacentes.
        if (traveeGauche) {
            var decalageTraveeGauche = tableauTravees[nomTraveeGauche]['decalage'];
            if (Math.abs(decalageTraveeGauche - (tableauTravees[nomTravee]['decalage'] + 1)) > 1) {
                alerte("Impossible de réaliser un tel décalage.");
                return;
            } else {
                if (decalageTraveeGauche == tableauTravees[nomTravee]['decalage']) {
                    travee.children[indicePGAV].visible = travee.children[indicePGAR].visible = traveeGauche.children[indicePDAR].visible = true;
                    traveeGauche.children[indicePDAV].visible = false;
                } else {
                    travee.children[indicePGAV].visible = travee.children[indicePGAR].visible = true;
                    traveeGauche.children[indicePDAV].visible = traveeGauche.children[indicePDAR].visible = false;
                }
            }
        }

        if (traveeDroite) {
            var decalageTraveeDroite = tableauTravees[nomTraveeDroite]['decalage'];
            if (Math.abs(decalageTraveeDroite - (tableauTravees[nomTravee]['decalage'] + 1)) > 1) {
                alerte("Impossible de réaliser un tel décalage.");
                return;
            } else {
                if (decalageTraveeDroite == tableauTravees[nomTravee]['decalage']) {
                    traveeDroite.children[indicePGAV].visible = travee.children[indicePGAR].visible = travee.children[indicePDAV].visible = true;
                    travee.children[indicePDAR].visible = false;
                } else {
                    traveeDroite.children[indicePGAV].visible = traveeDroite.children[indicePGAR].visible = true;
                    travee.children[indicePDAV].visible = travee.children[indicePDAR].visible = false;
                }
            }
        }

        travee.position.z += (LONGUEUR_TRAVEE / 2);
        tableauTravees[nomTravee]['positionZ'] += (LONGUEUR_TRAVEE / 2);
        tableauTravees[nomTravee]['decalage']++;

    } else { // décalage vers le fond

        tableauDecalages[numTravee - 1] -= 1;
        var nbConstructionSimule = recalculerConstructions(tableauDecalages);
        if (nbConstructionSimule > NB_CONSTRUCTIONS_MAXI) {
            alerte("Décalage refusé : vous avez atteint le nombre maximum de constructions autorisées (" + NB_CONSTRUCTIONS_MAXI + ").");
            return;
        }

        // On masque certains murs de la travée courante et également des travées adjacentes.
        if (traveeGauche) {
            var decalageTraveeGauche = tableauTravees[nomTraveeGauche]['decalage'];
            if (Math.abs(decalageTraveeGauche - (tableauTravees[nomTravee]['decalage'] - 1)) > 1) {
                alerte("Impossible de réaliser un tel décalage.");
                return;
            } else {
                if (decalageTraveeGauche == tableauTravees[nomTravee]['decalage']) {
                    travee.children[indicePGAV].visible = travee.children[indicePGAR].visible = traveeGauche.children[indicePDAV].visible = true;
                    traveeGauche.children[indicePDAR].visible = false;
                } else {
                    travee.children[indicePGAV].visible = travee.children[indicePGAR].visible = true;
                    traveeGauche.children[indicePDAV].visible = traveeGauche.children[indicePDAR].visible = false;
                }
            }
        }

        if (traveeDroite) {
            var decalageTraveeDroite = tableauTravees[nomTraveeDroite]['decalage'];
            if (Math.abs(decalageTraveeDroite - (tableauTravees[nomTravee]['decalage'] - 1)) > 1) {
                alerte("Impossible de réaliser un tel décalage.");
                return;
            } else {
                if (decalageTraveeDroite == tableauTravees[nomTravee]['decalage']) {
                    travee.children[indicePDAR].visible = traveeDroite.children[indicePGAV].visible = traveeDroite.children[indicePGAR].visible = true;
                    travee.children[indicePDAV].visible = false;
                } else {
                    traveeDroite.children[indicePGAV].visible = traveeDroite.children[indicePGAR].visible = true;
                    travee.children[indicePDAV].visible = travee.children[indicePDAR].visible = false;
                }
            }
        }

        travee.position.z -= (LONGUEUR_TRAVEE / 2);
        tableauTravees[nomTravee]['positionZ'] -= (LONGUEUR_TRAVEE / 2);
        tableauTravees[nomTravee]['decalage']--;

    }
    recalculerConstructions();
    unSelect();
}


export function creerTravee() {

    var prefixe = PREFIXE_TRAVEE + (nbTravees + 1);
    tableauTravees[prefixe] = new Array();

    // On teste d'abord si la construction de la nouvelle travée est autorisée : si ce n'est pas le cas, inutile d'aller plus loin.
    recalculerConstructions();

    if (nbTravees == (NB_TRAVEES_MAXI * NB_CONSTRUCTIONS_MAXI)) {
        var message = "Vous avez atteint le nombre maximal de travées autorisées (" + NB_TRAVEES_MAXI + " travées pour " + NB_CONSTRUCTIONS_MAXI + " constructions).";
        alerte(message);
        return;
    }
    nbTravees++;

    // Un module = 6 murs (AV + AR + 2 par pignon) + un sol + un plafond
    // IMPORTANT : on crée les murs avec la face avant DEVANT !!!!!!!!!!
    var wallAR = new THREE.Mesh(new THREE.BoxGeometry(LARGEUR_TRAVEE, HAUTEUR_TRAVEE, EPAISSEUR_MUR), wallOutMaterial);
    wallAR.position.z = -LARGEUR_TRAVEE + (EPAISSEUR_MUR / 2);

    var wallPDAR = new THREE.Mesh(new THREE.BoxGeometry(LONGUEUR_TRAVEE / 2 - EPAISSEUR_MUR, HAUTEUR_TRAVEE, EPAISSEUR_MUR), wallOutMaterial);
    wallPDAR.rotation.y = -Math.PI / 2;
    wallPDAR.position.x = ((-EPAISSEUR_MUR / 2) + LARGEUR_TRAVEE / 2) - 0.01;
    wallPDAR.position.z = -(LONGUEUR_TRAVEE / 4) + EPAISSEUR_MUR / 2;

    var wallPDAV = new THREE.Mesh(new THREE.BoxGeometry(LONGUEUR_TRAVEE / 2 - EPAISSEUR_MUR, HAUTEUR_TRAVEE, EPAISSEUR_MUR), wallOutMaterial);
    wallPDAV.rotation.y = -Math.PI / 2;
    wallPDAV.position.x = (-EPAISSEUR_MUR / 2) + LARGEUR_TRAVEE / 2;
    wallPDAV.position.z = (LONGUEUR_TRAVEE / 4) - EPAISSEUR_MUR / 2;

    var wallAV = new THREE.Mesh(new THREE.BoxGeometry(LARGEUR_TRAVEE, HAUTEUR_TRAVEE, EPAISSEUR_MUR), wallOutMaterial);
    wallAV.rotation.y = Math.PI;
    wallAV.position.z = LARGEUR_TRAVEE - (EPAISSEUR_MUR / 2);

    var wallPGAV = new THREE.Mesh(new THREE.BoxGeometry(LONGUEUR_TRAVEE / 2 - EPAISSEUR_MUR, HAUTEUR_TRAVEE, EPAISSEUR_MUR), wallOutMaterial);
    wallPGAV.rotation.y = Math.PI / 2;
    wallPGAV.position.x = (EPAISSEUR_MUR / 2) - LARGEUR_TRAVEE / 2;
    wallPGAV.position.z = (LONGUEUR_TRAVEE / 4) - EPAISSEUR_MUR / 2;

    var wallPGAR = new THREE.Mesh(new THREE.BoxGeometry(LONGUEUR_TRAVEE / 2 - EPAISSEUR_MUR, HAUTEUR_TRAVEE, EPAISSEUR_MUR), wallOutMaterial);
    wallPGAR.rotation.y = Math.PI / 2;
    wallPGAR.position.x = (EPAISSEUR_MUR / 2) - LARGEUR_TRAVEE / 2;
    wallPGAR.position.z = -(LONGUEUR_TRAVEE / 4) + EPAISSEUR_MUR / 2;

    var floor = new THREE.Mesh(new THREE.PlaneBufferGeometry(LARGEUR_TRAVEE, LONGUEUR_TRAVEE), floorMaterial);
    floor.position.set(0, (-HAUTEUR_TRAVEE / 2) + .01, 0);
    floor.rotation.x = -Math.PI / 2;
    floor.name = 'excluded';

    var top = new THREE.Mesh(new THREE.PlaneBufferGeometry(LARGEUR_TRAVEE, LONGUEUR_TRAVEE), topMaterial);
    top.rotation.x = -Math.PI / 2;
    top.position.set(0, (HAUTEUR_TRAVEE / 2) + .01, 0);
    top.visible = false;
    //    top.name = 'excluded';
    top.name = 'plancher_' + prefixe;

    var wallsGrp = new THREE.Group();
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
    wallsGrp.add(floor);
    wallsGrp.add(top);
    wallsGrp.name = prefixe;
    objetsModifiables.push(wallsGrp);

    // Pour la gestion des ombres
    for (var i = 0; i < wallsGrp.children.length; i++) {
        wallsGrp.children[i].receiveShadow = false;
        wallsGrp.children[i].castShadow = true;
    }

    var toit = creerToit(prefixe);
    wallsGrp.add(toit);

    // Initialisation de tableauTravees (qui contient les infos utilisées pour calculer le score VT notamment)
    tableauTravees.length++;
    tableauTravees[prefixe]['nom'] = prefixe;
    tableauTravees[prefixe]['nb_ouvertures_AR'] = 0;
    tableauTravees[prefixe]['nb_ouvertures_PDAR'] = 0;
    tableauTravees[prefixe]['nb_ouvertures_PDAV'] = 0;
    tableauTravees[prefixe]['nb_ouvertures_AV'] = 0;
    tableauTravees[prefixe]['nb_ouvertures_PGAV'] = 0;
    tableauTravees[prefixe]['nb_ouvertures_PGAR'] = 0;
    tableauTravees[prefixe]['decalage'] = 0;
    tableauTravees[prefixe]['positionX'] = 0;
    tableauTravees[prefixe]['positionZ'] = 0;

    // Détermination du numéro de construction et du rang de la travée courante
    if (nbTravees == 1) {
        tableauTravees[prefixe]['numConstruction'] = 1;
        tableauTravees[prefixe]['rangDansConstruction'] = 1;
    } else {
        var constructionVoisine = tableauTravees[PREFIXE_TRAVEE + (nbTravees - 1)]['numConstruction'];
        var rangVoisine = tableauTravees[PREFIXE_TRAVEE + (nbTravees - 1)]['rangDansConstruction'];
        if (rangVoisine == NB_TRAVEES_MAXI) {
            nbConstructions++;
            tableauTravees[prefixe]['numConstruction'] = nbConstructions;
            tableauTravees[prefixe]['rangDansConstruction'] = 1;
        } else {
            tableauTravees[prefixe]['numConstruction'] = constructionVoisine;
            tableauTravees[prefixe]['rangDansConstruction'] = rangVoisine + 1;
        }
    }

    initialiserScoresVT(PREFIXE_TRAVEE + nbTravees);

    if (DEBUG) {
        log('tableauTravees dans creerTravee : ');
        log(tableauTravees);
    }
    return wallsGrp;
}
