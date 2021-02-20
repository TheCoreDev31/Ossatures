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
    MF1d_Material,
    MF1g_Material,
    MF2_Material,
    MPEF_Material,
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
    restaurerPrefsUtilisateur,
    rechercherFaceOpposee
} from "./main.js"

import {
    unSelect
} from "./gui.js"



function degrees_to_radians(degrees) {
    var pi = Math.PI;
    return degrees * (pi / 180);
}


export function recreerTrappes() {

    for (var travee in tableauTravees) {
        if (tableauTravees[travee].rangDansConstruction == 1) {
            selectionnerSolivage(travee, "SOLT_bc");
        }
    }
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

    inventaire["MPE"] = inventaire["MPF"] = inventaire["MF1"] = inventaire["MF2"] = inventaire["MPG1"] = inventaire["MPG2"] = inventaire["MPEF"] = inventaire["MPI"] = 0;
    inventaire["MF1R"] = inventaire["MF2R"] = inventaire["MPER"] = 0;

    // On supprime également tous les solivages
    for (var i = 1; i <= nbTravees; i++) {
        var nomTravee = PREFIXE_TRAVEE + i;
        selectionnerSolivage(nomTravee, "SOLP");
    }
    inventaire["SOLE"] = inventaire["SOLT"] = 0;
    inventaire["SOLP"] = nbTravees;
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
        scene.getObjectByName(nomTravee + ">" + face + ">Incrustation").userData = {
            customVisibility: true
        };
        windowGrp.add(portionMur);

    } else { // Ouvertures "classiques"

        if (typeOuverture === 'F2' || typeOuverture === 'PF' || typeOuverture === 'F2R') nbPanneaux = 2;

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
        if (typeOuverture.includes('F1') || typeOuverture == 'F2' || typeOuverture == 'F2R' || typeOuverture == 'PF') {
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
    var fenetre = creerOuverture(nomTravee, nomFace, 'F1g', forcerIncrustation);
    ouvertures.push(porte);
    ouvertures.push(fenetre);

    return ouvertures;
}


export function traitementCreationOuverture(nomTravee, nomFace, ouvertures) {

    var nomOuverture;

    if (Array.isArray(ouvertures)) nomOuverture = "PE+F1";
    else nomOuverture = ouvertures.name;

    // A la création d'une ouverture, on rajoute TOUJOURS dans la scene la texture "classique" d'abord...
    if (nomOuverture != "PE+F1") { // Ouverture classique, hors combo "PE + F1"

        scene.getObjectByName(nomTravee).add(ouvertures);

    } else {

        var porte = ouvertures[0];
        var fenetre = ouvertures[1];

        modifierIncrustation(nomTravee, nomFace, PRODUITS['PE+F1']['codeModule'])
        inventaire["MF1"]--;
        inventaire["MPE"]--;
        inventaire["MPEF"]++;
        inventaire["MPL"]++;

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

    // .. et éventuellement, si l'on se trouve en mode "ossature bois", on masque l'ouverture avec sa
    // texture "classique" et on affiche l'équivalent en ossature bois.
    if ($("span:contains('ossatureBois')").parent().find("input[type='checkbox']").prop('checked')) {

        if (nomOuverture != "PE+F1") {

            var module = nomOuverture.substr(nomOuverture.lastIndexOf(' ') + 1, nomOuverture.length);
            var mur = nomOuverture.substring(0, nomOuverture.lastIndexOf('>'));
            var material;

            if (module == 'PO') {
                scene.getObjectByName(mur).material = MPI_Material;
            } else {
                scene.getObjectByName(nomOuverture).visible = false;

                switch (module) {
                    case "PE":
                        material = MPE_Material;
                        break;
                    case "F1d":
                        material = MF1d_Material;
                        break;
                    case "F1g":
                        material = MF1g_Material;
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
                    case "F2R":
                        material = MF2_Material;
                        break;
                    case "F1dR":
                        material = MF1d_Material;
                        break;
                    case "F1gR":
                        material = MF1g_Material;
                        break;
                    case "PER":
                        material = MPE_Material;
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
    var ancienSolivage, familleSolivage, decalageIncrustation = 0;

    if (ancienMaterial == SOLP_Material) ancienSolivage = "SOLP";
    if (ancienMaterial == SOLT_Material) ancienSolivage = "SOLT";
    if ((ancienMaterial == SOLE_1_Material) || (ancienMaterial == SOLE_2_Material)) ancienSolivage = "SOLE";

    switch (solivageChoisi) {
        case "SOLP":
            familleSolivage = "SOLP";
            plancher.material = SOLP_Material;
            break;
        case "SOLE_hg":
            familleSolivage = "SOLE";
            plancher.material = SOLE_1_Material;
            plancher.rotation.z = 0;
            break;
        case "SOLE_hd":
            familleSolivage = "SOLE";
            plancher.material = SOLE_2_Material;
            plancher.rotation.z = 0;
            break;
        case "SOLE_bd":
            familleSolivage = "SOLE";
            plancher.material = SOLE_1_Material;
            plancher.rotation.z = Math.PI;
            break;
        case "SOLE_bg":
            familleSolivage = "SOLE";
            plancher.material = SOLE_2_Material;
            plancher.rotation.z = Math.PI;
            break;
        case "SOLT_hc":
            familleSolivage = "SOLT";
            plancher.material = SOLT_Material;
            plancher.rotation.z = 0;
            break;
        case "SOLT_bc":
            familleSolivage = "SOLT";
            plancher.material = SOLT_Material;
            plancher.rotation.z = Math.PI;
            break;
    }
    inventaire[ancienSolivage]--;
    inventaire[familleSolivage]++;
    if (ancienSolivage == "SOLP" && familleSolivage != "SOLP") nbOuvertures++;
    tableauTravees[nomTravee].typeSolivage = solivageChoisi;

    // Attention : coordonnées relatives et pas absolues
    var positionIncrustation = 0;
    if (solivageChoisi.indexOf("_h") != -1) positionIncrustation = -20;
    if (solivageChoisi.indexOf("_b") != -1) positionIncrustation = 20;
    scene.getObjectByName(nomTravee + ">plancher>Incrustation").position.z = positionIncrustation;

    modifierIncrustation(nomTravee, "plancher", solivageChoisi);
}



export function gererDecalageTravee(laNouvelleTravee) {

    if (nbTravees > 1) {

        // Rajout d'une travée -> on décale tout le monde vers la gauche (suivant X).
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
                        decalerTravee(laNouvelleTravee.name, 'front', false);
                    }
                    break;
                default:
                    if (verifierPossibiliteDecalage(laNouvelleTravee.name, 'back')) {
                        decalerTravee(laNouvelleTravee.name, 'back', false);
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
        laNouvelleTravee.children[indiceToit].children[indicePignonGauche].material = PINT_Droite_Material;

        // Enfin, on re-crée une ouverture dans la travée la plus à gauche.
        selectionnerSolivage('Travee 1', "SOLT_bc");
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
    /*
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
    */
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
        if (nbConstructionSimule > NB_CONSTRUCTIONS_MAXI) {
            if (modeVerbose) {
                alerte("Décalage refusé : nombre maximum de constructions atteint (" + NB_CONSTRUCTIONS_MAXI + ").");
            }
            return;
        }
        if ((resultatsSimulation[1] > NB_TRAVEES_MAXI) || (resultatsSimulation[2] > NB_TRAVEES_MAXI)) {
            if (modeVerbose) {
                alerte("Décalage refusé : nombre maximum de travées atteint (" + NB_TRAVEES_MAXI + ").");
            }
            return;
        }

        if (modeVerbose) {
            if (nbOuvertures > 0) {
                if (!confirm("Vous allez perdre toutes les ouvertures déjà créées. Continuer ?")) return;

                unSelect();
                supprimerToutesOuvertures();

                if ($("span:contains('ossatureBois')").parent().find("input[type='checkbox']").prop('checked'))
                    $("span:contains('ossatureBois')").click();
            }
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

                    // Cas A            
                    travee.children[indicePDAV].visible = travee.children[indicePDAR].visible = true;
                    traveeDroite.children[indicePGAV].visible = traveeDroite.children[indicePGAR].visible = true;

                    // Gestion des pignons (changement de nom + de texture)
                    travee.children[indiceToit].children[indicePignonDroit].visible = true;
                    travee.children[indiceToit].children[indicePignonDroit].name = "PEXT_droit_excluded";
                    travee.children[indiceToit].children[indicePignonDroit].material = pignonMaterial;
                    modifierIncrustation(travee.name, "PD", "PEXT");

                    traveeDroite.children[indiceToit].children[indicePignonGauche].name = "PEXT_gauche_excluded";
                    traveeDroite.children[indiceToit].children[indicePignonGauche].material = pignonMaterial;
                    modifierIncrustation(traveeDroite.name, "PG", "PEXT");

                    inventaire["MPL"] += 2;
                    modifierIncrustation(travee.name, "PDAR", "MPL");

                } else {

                    // Cas B
                    travee.children[indicePDAV].visible = travee.children[indicePDAR].visible = false;
                    traveeDroite.children[indicePGAV].visible = traveeDroite.children[indicePGAR].visible = true;

                    // Gestion des pignons (changement de nom + de texture)
                    travee.children[indiceToit].children[indicePignonDroit].visible = false;
                    modifierIncrustation(travee.name, "PD", "PINT");
                    traveeDroite.children[indiceToit].children[indicePignonGauche].name = traveeDroite.name + ">PINT";
                    traveeDroite.children[indiceToit].children[indicePignonGauche].material = PINT_Droite_Material;
                    modifierIncrustation(traveeDroite.name, "PG", "PINT");

                    inventaire["MPL"] -= 2;
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

                    // Cas C
                    travee.children[indicePGAV].visible = travee.children[indicePGAR].visible = true;
                    traveeGauche.children[indicePDAR].visible = traveeGauche.children[indicePDAV].visible = true;

                    // Gestion des pignons (changement de nom + de texture)
                    traveeGauche.children[indiceToit].children[indicePignonDroit].visible = true;
                    travee.children[indiceToit].children[indicePignonGauche].name = "PEXT_gauche_excluded";
                    travee.children[indiceToit].children[indicePignonGauche].material = pignonMaterial;
                    modifierIncrustation(travee.name, "PG", "PEXT");

                    traveeGauche.children[indiceToit].children[indicePignonDroit].name = "PEXT_droit_excluded";
                    traveeGauche.children[indiceToit].children[indicePignonDroit].material = pignonMaterial;
                    modifierIncrustation(traveeGauche.name, "PD", "PEXT");

                    inventaire["MPL"] += 2;
                    modifierIncrustation(traveeGauche.name, "PDAR", "MPL");

                } else {

                    // Cas D
                    travee.children[indicePGAV].visible = travee.children[indicePGAR].visible = true;
                    traveeGauche.children[indicePDAV].visible = traveeGauche.children[indicePDAR].visible = false;

                    // Gestion des pignons (changement de nom + de texture)
                    traveeGauche.children[indiceToit].children[indicePignonDroit].visible = false;
                    modifierIncrustation(traveeGauche.name, "PD", "PINT");
                    travee.children[indiceToit].children[indicePignonGauche].name = nomTravee + ">PINT";
                    travee.children[indiceToit].children[indicePignonGauche].material = PINT_Droite_Material;
                    modifierIncrustation(travee.name, "PG", "PINT");

                    inventaire["MPL"] -= 2;
                }
            }
        }

        travee.position.z += (LONGUEUR_TRAVEE / 2);
        tableauTravees[nomTravee]['positionZ'] += (LONGUEUR_TRAVEE / 2);
        tableauTravees[nomTravee]['decalage']++;

    } else { // décalage vers le fond

        tableauDecalages[numTravee - 1] -= 1;
        var resultatsSimulation = simulerCalculConstructions(tableauDecalages);
        var nbConstructionSimule = resultatsSimulation[0];
        if (nbConstructionSimule > NB_CONSTRUCTIONS_MAXI) {
            if (modeVerbose) {
                alerte("Décalage refusé : nombre maximum de constructions atteint (" + NB_CONSTRUCTIONS_MAXI + ").");
            }
            return;
        }
        if ((resultatsSimulation[1] > NB_TRAVEES_MAXI) || (resultatsSimulation[2] > NB_TRAVEES_MAXI)) {
            if (modeVerbose) {
                alerte("Décalage refusé : nombre maximum de travées atteint (" + NB_TRAVEES_MAXI + ").");
            }
            return;
        }

        if (modeVerbose) {
            if (nbOuvertures > 0) {
                if (!confirm("Vous allez perdre toutes les ouvertures déjà créées. Continuer ?")) return;

                unSelect();
                supprimerToutesOuvertures();

                if ($("span:contains('ossatureBois')").parent().find("input[type='checkbox']").prop('checked'))
                    $("span:contains('ossatureBois')").click();
            }
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

                    // Cas E
                    travee.children[indicePDAR].visible = travee.children[indicePDAV].visible = true;
                    traveeDroite.children[indicePGAR].visible = traveeDroite.children[indicePGAV].visible = true;

                    // Gestion des pignons (changement de nom + de texture)
                    travee.children[indiceToit].children[indicePignonDroit].visible = true;
                    travee.children[indiceToit].children[indicePignonDroit].name = "PEXT_droit_excluded";
                    travee.children[indiceToit].children[indicePignonDroit].material = pignonMaterial;
                    modifierIncrustation(travee.name, "PD", "PEXT");

                    traveeDroite.children[indiceToit].children[indicePignonGauche].name = "PEXT_gauche_excluded";
                    traveeDroite.children[indiceToit].children[indicePignonGauche].material = pignonMaterial;
                    modifierIncrustation(traveeDroite.name, "PG", "PEXT");

                    inventaire["MPL"] += 2;
                } else {

                    // Cas F
                    travee.children[indicePDAV].visible = travee.children[indicePDAR].visible = false;
                    traveeDroite.children[indicePGAV].visible = traveeDroite.children[indicePGAR].visible = true;

                    travee.children[indiceToit].children[indicePignonDroit].visible = false;
                    modifierIncrustation(travee.name, "PD", "PINT");

                    // Gestion des pignons (changement de nom + de texture)
                    traveeDroite.children[indiceToit].children[indicePignonGauche].name = traveeDroite.name + ">PINT";
                    traveeDroite.children[indiceToit].children[indicePignonGauche].material = PINT_Droite_Material;
                    modifierIncrustation(traveeDroite.name, "PG", "PINT");

                    inventaire["MPL"] -= 2;
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

                    // Cas G
                    travee.children[indicePGAV].visible = travee.children[indicePGAR].visible = true;
                    traveeGauche.children[indicePDAV].visible = traveeGauche.children[indicePDAR].visible = true;

                    // Gestion des pignons (changement de nom + de texture)
                    traveeGauche.children[indiceToit].children[indicePignonDroit].visible = true;
                    travee.children[indiceToit].children[indicePignonGauche].name = "PEXT_gauche_excluded";
                    travee.children[indiceToit].children[indicePignonGauche].material = pignonMaterial;
                    modifierIncrustation(travee.name, "PG", "PEXT");

                    traveeGauche.children[indiceToit].children[indicePignonDroit].name = "PEXT_droit_excluded";
                    traveeGauche.children[indiceToit].children[indicePignonDroit].material = pignonMaterial;
                    modifierIncrustation(traveeGauche.name, "PD", "PEXT");

                    inventaire["MPL"] += 2;

                } else {

                    // Cas H
                    travee.children[indicePGAV].visible = travee.children[indicePGAR].visible = true;
                    traveeGauche.children[indicePDAV].visible = traveeGauche.children[indicePDAR].visible = false;

                    // Gestion des pignons (changement de nom + de texture)
                    traveeGauche.children[indiceToit].children[indicePignonDroit].visible = false;
                    modifierIncrustation(traveeGauche.name, "PD", "PINT");
                    travee.children[indiceToit].children[indicePignonGauche].name = nomTravee + ">PINT";
                    travee.children[indiceToit].children[indicePignonGauche].material = PINT_Droite_Material;
                    modifierIncrustation(travee.name, "PG", "PINT");

                    inventaire["MPL"] -= 2;
                }
            }
        }

        travee.position.z -= (LONGUEUR_TRAVEE / 2);
        tableauTravees[nomTravee]['positionZ'] -= (LONGUEUR_TRAVEE / 2);
        tableauTravees[nomTravee]['decalage']--;

    }
    recalculerConstructions();
    recreerTrappes();
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
        inventaire["MPL"] -= 2; // Car 2 murs disparaissent.
    }
    hidePignonIncrustations();

    recalculerConstructions();
    incrusterCotes();

    // On déplace également la boussole pour qu'elle soit toujours à la même distance de la droite de la construction
    scene.getObjectByName('boussole').position.x = tableauTravees["Travee " + nbTravees].positionX + 40;

    restaurerPrefsUtilisateur(nbTravees, travee);
}
