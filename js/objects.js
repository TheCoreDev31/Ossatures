import {
    COLOR_ARRAY,
    glassMaterial,
    windowMaterial,
    doorMaterial,
    roofMaterial,
    garageDoorMaterial,
    wallMaterial,
    pignonMaterial,
    floorMaterial,
    SOLP_Material,
    SOLE_1_Material,
    SOLE_2_Material,
    SOLT_Material,
    MPL_Material,
    MPI_Material,
    MPE_Material,
    MF1_Material,
    MF2_Material,
    MPF_Material,
    MPG1_Material,
    MPG2_Material,
    PEXT_Material,
    PINT_Droite_Material,
    PINT_Gauche_Material,
    createText
} from "./materials.js"

import {
    log,
    alerte,
    mergeGroups,
    extraireNomTravee,
    extraireFace,
    retirerObjetModifiable,
    initialiserScoresVT,
    recalculerConstructions,
    simulerCalculConstructions,
    modifierIncrustation,
    hidePignonIncrustations,
    incrusterCotes,
    restaurerPrefsUtilisateur
} from "./main.js"

import {
    unSelect
} from "./gui.js"



function degrees_to_radians(degrees) {
    var pi = Math.PI;
    return degrees * (pi / 180);
}


export function supprimerToutesOuvertures() {

    // Supprime toutes les ouvertures du projet (fenêtres, solivages, ...), par exemple lors de l'ajout d'une travée ou son décalage.
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

    inventaire["MPE"] = inventaire["MPFE"] = inventaire["MF1"] = inventaire["MF2"] = inventaire["MPG1"] = inventaire["MPG2"] = inventaire["MPF"] = inventaire["MPI"] = 0;
    inventaire["MPL"] = nbTravees * 6;


    // On supprime également tous les solivages
    inventaire["SOLP"] = nbTravees;
    inventaire["SOLE"] = inventaire["SOLT"] = 0;
    for (var i = 1; i <= nbTravees; i++) {
        var nomTravee = PREFIXE_TRAVEE + i;
        tableauTravees[nomTravee].typeSolivage = "SOLP";
        scene.getObjectByName(nomTravee + ">plancher").material = SOLP_Material;
        modifierIncrustation(nomTravee, "plancher", "SOLP");
    }

    nbOuvertures = 0;
}

export function supprimerOuverture(nomObjet) {

    // Supprimer une ouverture (hors solivage) bien spécifique, lorsque demandé depuis l'IHM
    var travee = extraireNomTravee(nomObjet);
    var face = extraireFace(nomObjet);
    var objet = scene.getObjectByName(nomObjet);
    var nomModule = nomObjet.substr(nomObjet.lastIndexOf(' ') + 1);

    // Pour le cas particulier du portique intérieur, on raffiche la cloison précédemment masquée.
    if (nomObjet.includes("PO")) {
        var portique = scene.getObjectByName(extraireNomTravee(nomObjet) + ">" + extraireFace(nomObjet));
        portique.visible = true;
    }

    // Il faut supprimer l'objet à l'IHM, ainsi que sa référence dans l'incrustation ...
    scene.getObjectByName(travee).remove(objet);
    // A SUPPRIMER
    //    scene.remove(objet);
    modifierIncrustation(travee, face, PRODUITS['MU']['codeModule']);
    nbOuvertures--;

    // recalculer les scores VT de la travée concernée...
    tableauTravees[travee]['nb_ouvertures_' + face]--;
    tableauTravees[travee]['vt_' + face] = PRODUITS['MU']['VT'];

    // Si l'on est en vue "Ossature bois", il faut également rafraichir la texture du mur sur lequel on vient de supprimer l'ouverture.
    var modeOssatureBois = $("span:contains('ossatureBois')").parent().find("input[type='checkbox']").prop('checked');

    if (modeOssatureBois) {
        var mur = nomObjet.substring(0, nomObjet.lastIndexOf('>'));
        scene.getObjectByName(mur).material = MPL_Material;
        objetSelectionne = travee + ">" + face;
    }

    // et enfin, déselectionner l'objet.
    retirerObjetModifiable(objet.name);
    if (!modeOssatureBois) objetSelectionne = '';
    unSelect();
    if (modeOssatureBois) objetSelectionne = '';

    // On met à jour l'inventaire du projet.
    inventaire[PRODUITS[nomModule].codeModule]--;
    inventaire["MPL"]++;

    if (DEBUG) {
        log('tableauTravee APRES supprimerOuverture :');
        log(tableauTravees);
    }
}


export function creerOuverture(nomTravee, face, typeOuverture, forcerIncrustation = false) {

    var windowGrp = new THREE.Group();
    var largeur, hauteur, epaisseur, elevation, decalageX;
    var nbPanneaux = 1;
    var murInterieur = false;

    // On récupère d'abord les caractéristiques de l'ouverture à créer
    largeur = PRODUITS[typeOuverture]['largeur'];
    hauteur = PRODUITS[typeOuverture]['hauteur'];
    elevation = PRODUITS[typeOuverture]['elevation'];
    epaisseur = PRODUITS[typeOuverture]['epaisseur'];
    decalageX = PRODUITS[typeOuverture]['decalageX'];


    var dernierRang = 2;
    if ((face.includes('PG') && tableauTravees[nomTravee]['rangDansConstruction'] != 1) ||
        (face.includes('PD') && tableauTravees[nomTravee]['rangDansConstruction'] != dernierRang)) {
        murInterieur = true;
    }

    // Le portique intérieur est un cas bien particulier : on supprime la cloison et on la remplace pour une ouverture ayant le même matériel qu'un mur.
    if (typeOuverture == 'PO') {
        var facade = scene.getObjectByName(nomTravee + ">" + face);
        facade.visible = false;
        var portionMur = new THREE.Mesh(new THREE.BoxGeometry((LONGUEUR_TRAVEE / 2), 4, EPAISSEUR_MUR), wallMaterial);
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
            if (typeOuverture.includes('PG1')) {
                var windowDoor = new THREE.Mesh(new THREE.BoxGeometry(largeur - 0.5, hauteur - 0.5, EPAISSEUR_MUR + 0.2), garageDoorMaterial);
            } else if (typeOuverture.includes('PG2')) {
                var windowDoor = new THREE.Mesh(new THREE.BoxGeometry(largeur - 0.5, hauteur - 0.5, EPAISSEUR_MUR + 0.2), garageDoorMaterial);
            } else
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
            positionX = 0 + decalageX;
            positionZ = (LONGUEUR_TRAVEE / 2) - epaisseur / 2 + 0.5;
            break;
        case 'AR':
            windowGrp.rotation.y = Math.PI;
            positionX = 0 - decalageX;
            positionZ = -(LONGUEUR_TRAVEE / 2) + (epaisseur / 2) - 0.5;
            break;
        case 'PGAV':
            windowGrp.rotation.y = -Math.PI / 2;
            positionX = -(LARGEUR_TRAVEE / 2) + (epaisseur / 2) - 0.5;
            positionZ = (LONGUEUR_TRAVEE / 4) + decalageX;
            break;
        case 'PGAR':
            windowGrp.rotation.y = -Math.PI / 2;
            positionX = -(LARGEUR_TRAVEE / 2) + (epaisseur / 2) - 0.5;
            positionZ = -(LONGUEUR_TRAVEE / 4) + decalageX;
            break;
        case 'PDAV':
            windowGrp.rotation.y = Math.PI / 2;
            positionX = (LARGEUR_TRAVEE / 2) - (epaisseur / 2) + 0.5;
            positionZ = (LONGUEUR_TRAVEE / 4) - decalageX;
            break;
        case 'PDAR':
            windowGrp.rotation.y = Math.PI / 2;
            positionX = (LARGEUR_TRAVEE / 2) - (epaisseur / 2) + 0.5;
            positionZ = -(LONGUEUR_TRAVEE / 4) - decalageX;
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
    incrustation.name = nomTravee + '>' + face + '>Incrustation';
    modifierIncrustation(nomTravee, face, PRODUITS[typeOuverture]['codeModule']);

    if (DEBUG) {
        log('tableauTravee APRES creerOuverture :');
        log(tableauTravees);
    }

    // On met à jour l'inventaire du projet.
    inventaire[PRODUITS[typeOuverture]['codeModule']]++;
    inventaire["MPL"]--;

    return windowGrp;
}


export function creerComboOuvertures(nomTravee, nomFace, forcerIncrustation = false) {

    var ouvertures = new Array();

    var porte = creerOuverture(nomTravee, nomFace, 'PE', forcerIncrustation);
    var fenetre = creerOuverture(nomTravee, nomFace, 'F1', forcerIncrustation);
    ouvertures.push(porte);
    ouvertures.push(fenetre);

    return ouvertures;
}


export function traitementCreationOuverture(nomTravee, nomFace, ouvertures) {

    var nomOuverture;

    if (Array.isArray(ouvertures)) nomOuverture = "PE+F1";
    else nomOuverture = ouvertures.name;

    if (nomOuverture != "PE+F1") { // Ouverture classique, hors combo "PE + F1"

        scene.getObjectByName(nomTravee).add(ouvertures);

    } else {

        var porte = ouvertures[0];
        var fenetre = ouvertures[1];

        modifierIncrustation(nomTravee, nomFace, PRODUITS['PE+F1']['codeModule'])
        inventaire["MF1"]--;
        inventaire["MPE"]--;
        inventaire["MPEF"]++;

        var nouveauGroupe = new THREE.Group();
        nouveauGroupe = mergeGroups(porte, fenetre);
        nouveauGroupe.name = nomTravee + '>' + nomFace + '>Ouverture ' + 'PE+F1';
        objetsModifiables.push(nouveauGroupe);
        tableauTravees[nomTravee]['nb_ouvertures_' + nomFace]--;
        tableauTravees[nomTravee]['vt_' + nomFace] = PRODUITS['PE+F1']['VT'];
        nbOuvertures--;

        var laTravee = scene.getObjectByName(nomTravee);
        laTravee.add(nouveauGroupe);
        laTravee.remove(porte);
        retirerObjetModifiable(porte.name);

        laTravee.remove(fenetre);
        retirerObjetModifiable(fenetre.name);
    }

    // Traitement si l'on se trouve en mode "ossature bois" : il faut masquer l'ouverture
    // que l'on vient de créer et afficher l'équivalent en ossature bois.
    if ($("span:contains('ossatureBois')").parent().find("input[type='checkbox']").prop('checked')) {

        if (nomOuverture != "PE+F1") {

            var module = nouvelleOuverture.name.substr(nouvelleOuverture.name.lastIndexOf(' ') + 1, nouvelleOuverture.name.length);
            var mur = nouvelleOuverture.name.substring(0, nouvelleOuverture.name.lastIndexOf('>'));
            var material;

            if (module == 'PO') {
                scene.getObjectByName(mur).material = MPI_Material;
            } else {
                scene.getObjectByName(nouvelleOuverture.name).visible = false;

                switch (module) {
                    case "PE":
                        material = MPE_Material;
                        break;
                    case "F1":
                        material = MF1_Material;
                        break;
                    case "F2":
                        material = MF2_Material;
                        break;
                    case "PF":
                        material = MPF_Material;
                        break;
                    case "PG1":
                        material = MPG1_Material;
                        break;
                    case "PG2":
                        material = MPG2_Material;
                        break;
                }
                scene.getObjectByName(mur).material = material;
            }
        } else {

            // Combo PE + F1
            scene.getObjectByName(nouveauGroupe.name).visible = false;

            var mur = nouveauGroupe.name.substring(0, nouveauGroupe.name.lastIndexOf('>'));
            var material = MPEF_Material;
            scene.getObjectByName(mur).material = material;
        }
    }
}


export function creerToit(nomTravee) {
    var prefixe = PREFIXE_TRAVEE + nbTravees;
    var roofGrp = new THREE.Group();
    var frontPan = new THREE.Mesh(new THREE.BoxBufferGeometry(LARGEUR_TRAVEE, (LONGUEUR_TRAVEE / 2) * 1.305, 0.2), roofMaterial);
    frontPan.position.set(0, HAUTEUR_TRAVEE, (LONGUEUR_TRAVEE / 2) - 17.5);
    frontPan.rotateX(-degrees_to_radians(55));
    frontPan.castShadow = true;
    frontPan.name = prefixe + '>toit_front_excluded';
    roofGrp.add(frontPan);

    var rearPan = frontPan.clone();
    rearPan.rotateX(2 * degrees_to_radians(55));
    rearPan.position.set(0, HAUTEUR_TRAVEE, -(LONGUEUR_TRAVEE / 2) + 17.5);
    rearPan.castShadow = true;
    rearPan.name = prefixe + '>toit_back_excluded';
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
    var leftPignon = new THREE.Mesh(new THREE.ExtrudeGeometry(pignonGeometry, extrudeSettings), pignonMaterial);
    leftPignon.geometry.faces[2].materialIndex = leftPignon.geometry.faces[3].materialIndex = 1;
    leftPignon.rotation.y = Math.PI / 2;
    leftPignon.position.set(-(LARGEUR_TRAVEE / 2), (HAUTEUR_TRAVEE / 2), 0);
    leftPignon.name = prefixe + '>PEXT_gauche_excluded';

    var rightPignon = new THREE.Mesh(new THREE.ExtrudeGeometry(pignonGeometry, extrudeSettings), pignonMaterial);
    rightPignon.geometry.faces[2].materialIndex = rightPignon.geometry.faces[3].materialIndex = 1;
    rightPignon.rotation.y = -Math.PI / 2;
    rightPignon.position.set((LARGEUR_TRAVEE / 2), (HAUTEUR_TRAVEE / 2), 0);
    rightPignon.name = prefixe + '>PEXT_droit_excluded';

    roofGrp.add(leftPignon);
    roofGrp.add(rightPignon);
    roofGrp.name = nomTravee + '>Toit';

    inventaire["SOLP"] += 1;
    // Le reste de la MAJ de l'inventaire est traité dans la méthode appelante.

    return roofGrp;
}


export function selectionnerSolivage(nomTravee, solivageChoisi) {

    var plancher = scene.getObjectByName(nomTravee + ">plancher");
    var ancienMaterial = plancher.material;
    var ancienSolivage, typeSolivage, decalageIncrustation = 0;

    if (ancienMaterial == SOLP_Material) ancienSolivage = "SOLP";
    if (ancienMaterial == SOLT_Material) ancienSolivage = "SOLT";
    if ((ancienMaterial == SOLE_1_Material) || (ancienMaterial == SOLE_2_Material)) ancienSolivage = "SOLE";

    switch (solivageChoisi) {
        case "plein":
            typeSolivage = "SOLP";
            plancher.material = SOLP_Material;
            break;
        case "haut-gauche":
            typeSolivage = "SOLE";
            plancher.material = SOLE_1_Material;
            plancher.rotation.z = 0;
            break;
        case "haut-droite":
            typeSolivage = "SOLE";
            plancher.material = SOLE_2_Material;
            plancher.rotation.z = 0;
            break;
        case "bas-droite":
            typeSolivage = "SOLE";
            plancher.material = SOLE_1_Material;
            plancher.rotation.z = Math.PI;
            break;
        case "bas-gauche":
            typeSolivage = "SOLE";
            plancher.material = SOLE_2_Material;
            plancher.rotation.z = Math.PI;
            break;
        case "haut-centre":
            typeSolivage = "SOLT";
            plancher.material = SOLT_Material;
            plancher.rotation.z = 0;
            break;
        case "bas-centre":
            typeSolivage = "SOLT";
            plancher.material = SOLT_Material;
            plancher.rotation.z = Math.PI;
            break;
    }
    if (solivageChoisi.indexOf("haut") != -1) decalageIncrustation = -1;
    if (solivageChoisi.indexOf("bas") != -1) decalageIncrustation = 1;

    inventaire[ancienSolivage]--;
    inventaire[typeSolivage]++;
    nbOuvertures++;

    tableauTravees[nomTravee].typeSolivage = typeSolivage;

    var positionIncrustation = tableauTravees[nomTravee].positionZ;
    if (decalageIncrustation < 0) positionIncrustation -= ((LONGUEUR_TRAVEE / 2) - 15);
    if (decalageIncrustation > 0) positionIncrustation += ((LONGUEUR_TRAVEE / 2) - 15);

    modifierIncrustation(nomTravee, "plancher", typeSolivage);
    scene.getObjectByName(nomTravee + ">plancher>Incrustation").position.z = positionIncrustation;
}



export function gererDecalageTravee(laNouvelleTravee) {

    if (nbTravees > 1) {

        // Rajout d'une travée -> on décale tout le monde vers la droite (suivant X).
        laNouvelleTravee.translateX(LARGEUR_TRAVEE / 2 * (nbTravees - 1));
        tableauTravees[laNouvelleTravee.name]['positionX'] += (LARGEUR_TRAVEE / 2 * (nbTravees - 1));
        for (var i = nbTravees - 1; i > 0; i--) {
            var traveePrecedente = scene.getObjectByName(PREFIXE_TRAVEE + i);
            traveePrecedente.translateX(-LARGEUR_TRAVEE / 2);
            tableauTravees[traveePrecedente.name]['positionX'] -= LARGEUR_TRAVEE / 2;
        }

        // La travée doit-elle être décalée suivant Z, car une nouvelle travée aura toujours le même décalage que sa voisine de gauche.
        var decalageVoisineGauche = tableauTravees[PREFIXE_TRAVEE + (nbTravees - 1)]['decalage'];
        if (decalageVoisineGauche != 0) {

            switch (decalageVoisineGauche) {
                case 1:
                    if (verifierPossibiliteDecalage(laNouvelleTravee.name, 'front')) {
                        decalerTravee(laNouvelleTravee.name, 'front');
                    }
                    break;
                default:
                    if (verifierPossibiliteDecalage(laNouvelleTravee.name, 'back')) {
                        decalerTravee(laNouvelleTravee.name, 'back');
                    }
                    break;
            }

        }

        // On masque les cloisons de la travée de gauche, ainsi que son pignon droit.
        var voisineGauche = scene.getObjectByName(PREFIXE_TRAVEE + (nbTravees - 1));
        voisineGauche.children[indicePDAV].visible = voisineGauche.children[indicePDAR].visible = false;
        voisineGauche.children[indiceToit].children[indicePignonDroit].visible = false;

        // Le pignon séparant les 2 travées devient un pignon intérieur, donc sélectionnable.
        laNouvelleTravee.children[indiceToit].children[indicePignonGauche].name = laNouvelleTravee.name + ">PINT";
        laNouvelleTravee.children[indiceToit].children[indicePignonGauche].material = PEXT_Material;
    }
}


export function verifierPossibiliteDecalage(nomTravee, direction, modeVerbose = true) {

    // Avant de décaler une travée, on vérifier les conditions sont remplies.
    if (nbTravees <= 1) {
        if (modeVerbose) {
            alerte("Vous devez avoir plus d'une travée dans votre projet.");
        }
        return false;
    }

    if ((direction == 'front' && tableauTravees[nomTravee]['decalage'] == 1) ||
        (direction == 'back' && tableauTravees[nomTravee]['decalage'] == -1)) {
        if (modeVerbose) {
            alerte("Travée déjà décalée dans cette direction.");
        }
        return false;
    }

    return true;
}


export function decalerTravee(nomTravee, direction, modeVerbose = true) {

    if (modeVerbose) {
        if (nbOuvertures > 0) {
            if (modeVerbose) {
                if (!confirm("Vous allez perdre toutes les ouvertures déjà créées. Continuer ?")) return;
            }

            unSelect();
            supprimerToutesOuvertures();
            if ($("span:contains('ossatureBois')").parent().find("input[type='checkbox']").prop('checked'))
                $("span:contains('ossatureBois')").click();
        }
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
        var resultatsSimulation = simulerCalculConstructions(tableauDecalages);
        var nbConstructionSimule = resultatsSimulation[0];
        var nbMaxtravees = resultatsSimulation[1];
        if (nbConstructionSimule > NB_CONSTRUCTIONS_MAXI) {
            if (modeVerbose) {
                alerte("Décalage refusé : nombre maximum de constructions atteint (" + NB_CONSTRUCTIONS_MAXI + ").");
            }
            return;
        }
        if (nbMaxtravees > NB_TRAVEES_MAXI) {
            if (modeVerbose) {
                alerte("Décalage refusé : nombre maximum de travées atteint (" + NB_TRAVEES_MAXI + ").");
            }
            return;
        }
        // On masque certains murs de la travée courante et également des travées adjacentes.
        if (traveeDroite) {
            var decalageTraveeDroite = tableauTravees[nomTraveeDroite]['decalage'];
            if (Math.abs(decalageTraveeDroite - (tableauTravees[nomTravee]['decalage'] + 1)) > 1) {
                if (modeVerbose) {
                    alerte("Impossible de réaliser un tel décalage.");
                }
                return;
            } else {
                // On teste la position du décalage entre travées AVANT le décalage.
                if (decalageTraveeDroite == tableauTravees[nomTravee]['decalage']) {
                    traveeDroite.children[indicePGAV].visible = travee.children[indicePGAR].visible = travee.children[indicePDAV].visible = true;
                    travee.children[indicePDAR].visible = false;
                    travee.children[indiceToit].children[indicePignonDroit].visible = true;

                    // Gestion des pignons (changement de nom + de texture)
                    travee.children[indiceToit].children[indicePignonDroit].name = "PEXT_droit_excluded";
                    travee.children[indiceToit].children[indicePignonDroit].material = pignonMaterial;
                    modifierIncrustation(travee.name, "PD", "PEXT");

                    traveeDroite.children[indiceToit].children[indicePignonGauche].name = "PEXT_gauche_excluded";
                    traveeDroite.children[indiceToit].children[indicePignonGauche].material = pignonMaterial;
                    modifierIncrustation(traveeDroite.name, "PG", "PEXT");

                } else {

                    traveeDroite.children[indicePGAV].visible = traveeDroite.children[indicePGAR].visible = true;
                    travee.children[indicePDAV].visible = travee.children[indicePDAR].visible = false;
                    travee.children[indiceToit].children[indicePignonDroit].visible = false;
                    modifierIncrustation(travee.name, "PD", "PINT");

                    // Gestion des pignons (changement de nom + de texture)
                    traveeDroite.children[indiceToit].children[indicePignonGauche].name = "PINT";
                    traveeDroite.children[indiceToit].children[indicePignonGauche].material = PEXT_Material;
                    modifierIncrustation(traveeDroite.name, "PG", "PINT");

                }
            }
        }

        if (traveeGauche) {
            var decalageTraveeGauche = tableauTravees[nomTraveeGauche]['decalage'];
            if (Math.abs(decalageTraveeGauche - (tableauTravees[nomTravee]['decalage'] + 1)) > 1) {
                if (modeVerbose) {
                    alerte("Impossible de réaliser un tel décalage.");
                }
                return;
            } else {
                // On teste la position du décalage entre travées AVANT le décalage.
                if (decalageTraveeGauche == tableauTravees[nomTravee]['decalage']) {
                    travee.children[indicePGAV].visible = travee.children[indicePGAR].visible = traveeGauche.children[indicePDAR].visible = true;
                    traveeGauche.children[indicePDAV].visible = false;
                    traveeGauche.children[indiceToit].children[indicePignonDroit].visible = true;

                    // Gestion des pignons (changement de nom + de texture)
                    travee.children[indiceToit].children[indicePignonGauche].name = "PEXT_gauche_excluded";
                    travee.children[indiceToit].children[indicePignonGauche].material = pignonMaterial;
                    modifierIncrustation(travee.name, "PG", "PEXT");

                    traveeGauche.children[indiceToit].children[indicePignonDroit].name = "PEXT_droit_excluded";
                    traveeGauche.children[indiceToit].children[indicePignonDroit].material = pignonMaterial;
                    modifierIncrustation(traveeGauche.name, "PD", "PEXT");
                } else {
                    travee.children[indicePGAV].visible = travee.children[indicePGAR].visible = true;
                    traveeGauche.children[indicePDAV].visible = traveeGauche.children[indicePDAR].visible = false;
                    traveeGauche.children[indiceToit].children[indicePignonDroit].visible = false;
                    modifierIncrustation(traveeGauche.name, "PD", "PINT");

                    // Gestion des pignons (changement de nom + de texture)
                    travee.children[indiceToit].children[indicePignonGauche].name = "PINT";
                    travee.children[indiceToit].children[indicePignonGauche].material = PEXT_Material;
                    modifierIncrustation(travee.name, "PG", "PINT");
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
            if (modeVerbose) {
                alerte("Décalage refusé : vous avez atteint le nombre maximum de constructions autorisées (" + NB_CONSTRUCTIONS_MAXI + ").");
            }
            return;
        }

        // On masque certains murs de la travée courante et également des travées adjacentes.
        if (traveeDroite) {
            var decalageTraveeDroite = tableauTravees[nomTraveeDroite]['decalage'];
            if (Math.abs(decalageTraveeDroite - (tableauTravees[nomTravee]['decalage'] - 1)) > 1) {
                if (modeVerbose) {
                    alerte("Impossible de réaliser un tel décalage.");
                }
                return;
            } else {
                // On teste la position du décalage entre travées AVANT le décalage.
                if (decalageTraveeDroite == tableauTravees[nomTravee]['decalage']) {
                    travee.children[indicePDAR].visible = traveeDroite.children[indicePGAV].visible = traveeDroite.children[indicePGAR].visible = true;
                    travee.children[indicePDAV].visible = false;
                    travee.children[indiceToit].children[indicePignonDroit].visible = true;

                    // Gestion des pignons (changement de nom + de texture)
                    travee.children[indiceToit].children[indicePignonDroit].name = "PEXT_droit_excluded";
                    travee.children[indiceToit].children[indicePignonDroit].material = pignonMaterial;
                    modifierIncrustation(travee.name, "PD", "PEXT");

                    traveeDroite.children[indiceToit].children[indicePignonGauche].name = "PEXT_gauche_excluded";
                    traveeDroite.children[indiceToit].children[indicePignonGauche].material = pignonMaterial;
                    modifierIncrustation(traveeDroite.name, "PG", "PEXT");

                } else {
                    traveeDroite.children[indicePGAV].visible = traveeDroite.children[indicePGAR].visible = true;
                    travee.children[indicePDAV].visible = travee.children[indicePDAR].visible = false;
                    travee.children[indiceToit].children[indicePignonDroit].visible = false;
                    modifierIncrustation(travee.name, "PD", "PINT");

                    // Gestion des pignons (changement de nom + de texture)
                    traveeDroite.children[indiceToit].children[indicePignonGauche].name = "PINT";
                    traveeDroite.children[indiceToit].children[indicePignonGauche].material = PEXT_Material;
                    modifierIncrustation(traveeDroite.name, "PG", "PINT");
                }
            }
        }

        if (traveeGauche) {
            var decalageTraveeGauche = tableauTravees[nomTraveeGauche]['decalage'];
            if (Math.abs(decalageTraveeGauche - (tableauTravees[nomTravee]['decalage'] - 1)) > 1) {
                if (modeVerbose) {
                    alerte("Impossible de réaliser un tel décalage.");
                }
                return;
            } else {
                // On teste la position du décalage entre travées AVANT le décalage.
                if (decalageTraveeGauche == tableauTravees[nomTravee]['decalage']) {
                    travee.children[indicePGAV].visible = travee.children[indicePGAR].visible = traveeGauche.children[indicePDAV].visible = true;
                    traveeGauche.children[indicePDAR].visible = false;
                    traveeGauche.children[indiceToit].children[indicePignonDroit].visible = true;

                    // Gestion des pignons (changement de nom + de texture)
                    travee.children[indiceToit].children[indicePignonGauche].name = "PEXT_gauche_excluded";
                    travee.children[indiceToit].children[indicePignonGauche].material = pignonMaterial;
                    modifierIncrustation(travee.name, "PG", "PEXT");

                    traveeGauche.children[indiceToit].children[indicePignonDroit].name = "PEXT_droit_excluded";
                    traveeGauche.children[indiceToit].children[indicePignonDroit].material = pignonMaterial;
                    modifierIncrustation(traveeGauche.name, "PD", "PEXT");

                } else {
                    travee.children[indicePGAV].visible = travee.children[indicePGAR].visible = true;
                    traveeGauche.children[indicePDAV].visible = traveeGauche.children[indicePDAR].visible = false;
                    traveeGauche.children[indiceToit].children[indicePignonDroit].visible = false;
                    modifierIncrustation(traveeGauche.name, "PD", "PINT");

                    // Gestion des pignons (changement de nom + de texture)
                    travee.children[indiceToit].children[indicePignonGauche].name = "PINT";
                    travee.children[indiceToit].children[indicePignonGauche].material = PEXT_Material;
                    modifierIncrustation(travee.name, "PG", "PINT");
                }
            }
        }


        travee.position.z -= (LONGUEUR_TRAVEE / 2);
        tableauTravees[nomTravee]['positionZ'] -= (LONGUEUR_TRAVEE / 2);
        tableauTravees[nomTravee]['decalage']--;

    }
    recalculerConstructions();
    incrusterCotes();
    unSelect();
}


export function creerTravee(modeVerbose = true) {

    var prefixe = PREFIXE_TRAVEE + (nbTravees + 1);
    tableauTravees[prefixe] = new Array();

    // On teste d'abord si la construction de la nouvelle travée est autorisée : si ce n'est pas le cas, inutile d'aller plus loin.
    recalculerConstructions();

    if (nbTravees == (NB_TRAVEES_MAXI * NB_CONSTRUCTIONS_MAXI)) {
        if (modeVerbose) {
            var message = "Vous avez atteint le nombre maximal de travées autorisées (" + NB_TRAVEES_MAXI + " travées pour " + NB_CONSTRUCTIONS_MAXI + " constructions).";
            alerte(message);
        }
        return;
    }
    nbTravees++;

    // Un module = 6 murs (AV + AR + 2 par pignon) + un sol + un plafond
    // IMPORTANT : on crée les murs avec la face extérieure DEVANT !!!!!!!!!!
    var wallAR = new THREE.Mesh(new THREE.BoxGeometry(LARGEUR_TRAVEE, HAUTEUR_TRAVEE, EPAISSEUR_MUR), wallMaterial);
    wallAR.position.z = -(LONGUEUR_TRAVEE / 2) + (EPAISSEUR_MUR / 2);

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
    wallAV.position.z = (LONGUEUR_TRAVEE / 2) - (EPAISSEUR_MUR / 2);

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
    floor.name = 'floor_excluded';

    var topGeometry = new THREE.BoxGeometry(LARGEUR_TRAVEE - 0.2, LONGUEUR_TRAVEE - 0.2, 0.2);
    var top = new THREE.Mesh(topGeometry, SOLP_Material);
    top.rotation.x = -Math.PI / 2;
    top.position.set(0, (HAUTEUR_TRAVEE / 2) + .01, 0);
    top.visible = true;
    top.name = prefixe + '>plancher';

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

    // Gestion de l'incrustation pour la vue d'implantation
    var lesMurs = new Array('AV', 'AR', 'PGAV', 'PGAR', 'PDAR', 'PDAV');
    var DECALAGE_INCRUSTATION = 7;
    for (var i = 0; i < 6; i++) {
        var decalageIncrustationX = 0,
            decalageIncrustationZ = 0;
        var incrustation = createText(PRODUITS['MU']['codeModule'], taillePoliceIncrustations);
        incrustation.rotation.x = -Math.PI / 2;
        var positionX = 0;
        var positionZ = 0;
        switch (lesMurs[i]) {
            case "AV":
                positionX = wallAV.position.x;
                positionZ = wallAV.position.z;
                decalageIncrustationZ = -DECALAGE_INCRUSTATION;
                break;
            case "AR":
                positionX = wallAR.position.x;
                positionZ = wallAR.position.z;
                decalageIncrustationZ = +DECALAGE_INCRUSTATION;
                break;
            case "PGAV":
                positionX = wallPGAV.position.x;
                positionZ = wallPGAV.position.z;
                decalageIncrustationX = DECALAGE_INCRUSTATION;
                break;
            case "PDAV":
                positionX = wallPDAV.position.x;
                positionZ = wallPDAV.position.z;
                decalageIncrustationX = -DECALAGE_INCRUSTATION;
                break;
            case "PGAR":
                positionX = wallPGAR.position.x;
                positionZ = wallPGAR.position.z;
                decalageIncrustationX = DECALAGE_INCRUSTATION;
                break;
            case "PDAR":
                positionX = wallPDAR.position.x;
                positionZ = wallPDAR.position.z;
                decalageIncrustationX = -DECALAGE_INCRUSTATION;
                break;
        }
        incrustation.position.set(positionX + decalageIncrustationX, -(HAUTEUR_TRAVEE / 2), positionZ + decalageIncrustationZ);
        incrustation.name = prefixe + ">" + lesMurs[i] + ">Incrustation";
        incrustation.visible = false;
        wallsGrp.add(incrustation);
    }

    // Incrustation pour les pignons de toiture et le solivage
    var positionX, positionY, positionZ = 0;
    var incrustation = createText('PEXT', taillePoliceIncrustations);
    incrustation.rotation.x = -Math.PI / 2;
    positionX = -(LARGEUR_TRAVEE / 2) + 6;
    positionY = (HAUTEUR_TRAVEE / 2) + 0.1;
    incrustation.position.set(positionX, positionY, positionZ);
    incrustation.name = prefixe + '>PG>Incrustation';
    wallsGrp.add(incrustation);

    var incrustation = createText('PEXT', taillePoliceIncrustations);
    incrustation.rotation.x = -Math.PI / 2;
    positionX = (LARGEUR_TRAVEE / 2) - 6;
    incrustation.position.set(positionX, positionY, positionZ);
    incrustation.name = prefixe + '>PD>Incrustation';
    wallsGrp.add(incrustation);

    var incrustation = createText('SOLP', taillePoliceIncrustations);
    incrustation.rotation.x = -Math.PI / 2;
    incrustation.position.set(0, positionY, 0);
    incrustation.name = prefixe + '>plancher>Incrustation';
    wallsGrp.add(incrustation);

    tableauTravees[prefixe].typeSolivage = "SOLP";
    hidePignonIncrustations();

    initialiserScoresVT(PREFIXE_TRAVEE + nbTravees);
    inventaire["MPL"] += 6;

    if (DEBUG) {
        log('tableauTravees dans creerTravee : ');
        log(tableauTravees);
    }
    return wallsGrp;
}


export function traitementCreationTravee(travee) {

    scene.add(travee);
    gererDecalageTravee(travee);

    // On modifie l'incrustation pour les pignons de toiture.
    if (nbTravees > 1) {
        modifierIncrustation(travee.name, 'PG', 'PINT', true);
        var voisine = scene.getObjectByName(PREFIXE_TRAVEE + (nbTravees - 1));
        modifierIncrustation(voisine.name, 'PD', 'PINT', true);
    }
    hidePignonIncrustations();

    recalculerConstructions();
    incrusterCotes();

    // On déplace également la boussole pour qu'elle soit toujours à la même distance de la droite de la construction
    scene.getObjectByName('boussole').position.x = tableauTravees["Travee " + nbTravees].positionX + 50;

    restaurerPrefsUtilisateur(nbTravees, travee);
}
