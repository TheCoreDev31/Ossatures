import {
    renderer,
    camera
}
from "./environment.js"

import {
    onMouseClick,
    onMouseMove,
    onWindowResize
} from "./events.js"

import {
    displayGui,
    unSelect
} from "./gui.js"

import {
    creerOuverture,
    creerToit,
    creerTravee
} from "./objects.js"

import {
    textMaterial,
    createText
} from "./materials.js"


// Fonctions communes
export function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
};


function init() {
    var controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.maxPolarAngle = Math.PI * 0.5;
    controls.minDistance = 1;
    controls.maxDistance = 500;

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
}

var PREFIXE_CONSTRUCTION = 'Construction ';
var matrices = new Array();
var matrice_1,
    matrice_2_1, matrice_2_2, matrice_2_3, matrice_2_4, matrice_2_5, matrice_2_6, matrice_2_7, matrice_2_8,
    matrice_3_1, matrice_3_2, matrice_3_3, matrice_3_4, matrice_3_5, matrice_3_6;


/********************************   Gestion des messages d'info et des alertes   ***************************************/
export function alerte(message) {
    $("#message-info").prop("class", "alerte");
    $("#message-info").html(message);
    setTimeout(function () {
        $("#message-info").prop("class", "normal");
        $("#message-info").html("");
    }, 4000);
    unSelect();
}

export function info(param) {
    if (param == null) {
        $("#message-info").prop("class", "normal");
        $("#message-info").html("");
        return;
    }
    if (typeof (param) == 'string') {
        newMessage
        $("#message-info").html(param);
        setTimeout(function () {
            $("#message-info").html("");
        }, 2000);
    } else {
        var newMessage = "Sélection : " + param.name;
        $("#message-info").prop("class", "normal");
        $("#message-info").html(newMessage);
    }
}

export function log(message) {
    console.log(message);
}


/************************   Gestion des cotes affichées sur le plan   ***********************************************/

export function recalculerCotes(direction = 'largeur') {

    if (direction == 'largeur') {
        if (scene.getObjectByName('CoteX')) {
            scene.remove(scene.getObjectByName('CoteX'));
            incrusterCotes('largeur');
        }
    } else {
        if (scene.getObjectByName('CoteY')) {
            scene.remove(scene.getObjectByName('CoteY'));
            incrusterCotes('longueur');
        }
    }
}

function incrusterCotes() {

    var texte = (nbTravees * (LARGEUR_TRAVEE / 10)) + ' m';
    var cotes = createText(texte);
    var hauteurTexte = -(HAUTEUR_TRAVEE / 2) + 0.2;
    var cotesGrp = new THREE.Group();

    cotes.rotation.x = -Math.PI / 2;
    cotes.position.set(0, hauteurTexte, (LONGUEUR_TRAVEE / 2) + 8);
    cotesGrp.add(cotes);

    var points = [];
    points.push(new THREE.Vector3((-LARGEUR_TRAVEE / 2) * nbTravees, hauteurTexte, (LONGUEUR_TRAVEE / 2) + 1));
    points.push(new THREE.Vector3((-LARGEUR_TRAVEE / 2) * nbTravees, hauteurTexte, (LONGUEUR_TRAVEE / 2) + 10));
    points.push(new THREE.Vector3((LARGEUR_TRAVEE / 2) * nbTravees, hauteurTexte, (LONGUEUR_TRAVEE / 2) + 10));
    points.push(new THREE.Vector3((LARGEUR_TRAVEE / 2) * nbTravees, hauteurTexte, (LONGUEUR_TRAVEE / 2) + 1));
    var line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), textMaterial);
    cotesGrp.add(line);
    cotesGrp.name = 'CoteX';
    cotesGrp.visible = false;
    scene.add(cotesGrp);

    /*      Calcul de la côte de profondeur, plus complexe en raison des décalages éventuels    */
    var texte = (LONGUEUR_TRAVEE / 10) + ' m';
    var cotes = createText(texte);
    var hauteurTexte = -(HAUTEUR_TRAVEE / 2) + 0.2;
    var cotesGrp = new THREE.Group();
    cotes.rotation.z = -Math.PI / 2;
    cotes.rotation.x = Math.PI / 2;
    cotes.rotation.y = Math.PI;
    cotes.position.set((LARGEUR_TRAVEE / 2) + 8, hauteurTexte, 0);
    cotesGrp.add(cotes);

    var points = [];
    points.push(new THREE.Vector3((LARGEUR_TRAVEE / 2) + 1, hauteurTexte, LONGUEUR_TRAVEE / 2));
    points.push(new THREE.Vector3((LARGEUR_TRAVEE / 2) + 10, hauteurTexte, LONGUEUR_TRAVEE / 2));
    points.push(new THREE.Vector3((LARGEUR_TRAVEE / 2) + 10, hauteurTexte, -LONGUEUR_TRAVEE / 2));
    points.push(new THREE.Vector3((LARGEUR_TRAVEE / 2) + 1, hauteurTexte, -LONGUEUR_TRAVEE / 2));
    var line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), textMaterial);
    cotesGrp.add(line);
    cotesGrp.name = 'CoteY';
    cotesGrp.visible = false;
    scene.add(cotesGrp);
}


function initCaracteristiquesOuvertures() {

    // Tableau fixe des produits
    var nbCaract = 7;
    PRODUITS['MU'] = new Array(nbCaract); // ScoreVT, largeur, hauteur, epaisseur, distance du sol
    PRODUITS['MU']['VT'] = 3;
    PRODUITS['MU']['largeur'] = PRODUITS['MU']['hauteur'] = PRODUITS['MU']['epaisseur'] = PRODUITS['MU']['elevation'] = 0;
    PRODUITS['MU']['interieur'] = PRODUITS['MU']['exterieur'] = true;

    PRODUITS['PE'] = new Array(nbCaract);
    PRODUITS['PE']['VT'] = 2;
    PRODUITS['PE']['largeur'] = 9;
    PRODUITS['PE']['hauteur'] = 21.5;
    PRODUITS['PE']['epaisseur'] = 3;
    PRODUITS['PE']['elevation'] = 0;
    PRODUITS['PE']['interieur'] = true;
    PRODUITS['PE']['exterieur'] = true;

    PRODUITS['F1'] = new Array(nbCaract);
    PRODUITS['F1']['VT'] = 2;
    PRODUITS['F1']['largeur'] = 4.5;
    PRODUITS['F1']['hauteur'] = 6.5;
    PRODUITS['F1']['epaisseur'] = 3;
    PRODUITS['F1']['elevation'] = 15;
    PRODUITS['F1']['interieur'] = false;
    PRODUITS['F1']['exterieur'] = true;

    PRODUITS['F2'] = new Array(nbCaract);
    PRODUITS['F2']['VT'] = 2;
    PRODUITS['F2']['largeur'] = 10.5;
    PRODUITS['F2']['hauteur'] = 11.5;
    PRODUITS['F2']['epaisseur'] = 3;
    PRODUITS['F2']['elevation'] = 10;
    PRODUITS['F2']['interieur'] = false;
    PRODUITS['F2']['exterieur'] = true;

    PRODUITS['PF'] = new Array(nbCaract);
    PRODUITS['PF']['VT'] = 1.4;
    PRODUITS['PF']['largeur'] = 18;
    PRODUITS['PF']['hauteur'] = 21.5;
    PRODUITS['PF']['epaisseur'] = 3;
    PRODUITS['PF']['elevation'] = 0;
    PRODUITS['PF']['interieur'] = true;
    PRODUITS['PF']['exterieur'] = true;

    PRODUITS['PG'] = new Array(nbCaract);
    PRODUITS['PG']['VT'] = 0;
    PRODUITS['PG']['largeur'] = 24;
    PRODUITS['PG']['hauteur'] = 20;
    PRODUITS['PG']['epaisseur'] = 3;
    PRODUITS['PG']['elevation'] = 0;
    PRODUITS['PG']['interieur'] = false;
    PRODUITS['PG']['exterieur'] = true;

    PRODUITS['PE+F1'] = new Array(nbCaract);
    PRODUITS['PE+F1']['VT'] = 0.5;
    PRODUITS['PE+F1']['largeur'] = 0;
    PRODUITS['PE+F1']['hauteur'] = 0;
    PRODUITS['PE+F1']['epaisseur'] = 0;
    PRODUITS['PE+F1']['elevation'] = 0;
    PRODUITS['PE+F1']['interieur'] = false;
    PRODUITS['PE+F1']['exterieur'] = true;

    PRODUITS['PO'] = new Array(nbCaract);
    PRODUITS['PO']['VT'] = 0;
    PRODUITS['PO']['largeur'] = 36;
    PRODUITS['PO']['hauteur'] = 25;
    PRODUITS['PO']['epaisseur'] = 0;
    PRODUITS['PO']['elevation'] = 0;
    PRODUITS['PO']['interieur'] = true;
    PRODUITS['PO']['exterieur'] = false;
}


function initMatricesScoreVT() {
    matrice_1 = new Array();
    matrice_1['nbTravees'] = 1;
    matrice_1['AV'] = 3;
    matrice_1['AR'] = 3;
    matrice_1['PG'] = 2;
    matrice_1['PD'] = 2;

    matrice_2_1 = new Array();
    matrice_2_1['nbTravees'] = 2;
    matrice_2_1['AV'] = 3;
    matrice_2_1['AR'] = 2.5;
    matrice_2_1['PG'] = 3;
    matrice_2_1['R1'] = 1.4;
    matrice_2_1['PD'] = 3;

    matrice_2_2 = new Array();
    matrice_2_2['nbTravees'] = 2;
    matrice_2_2['AV'] = 3;
    matrice_2_2['AR'] = 2.5;
    matrice_2_2['PG'] = 3;
    matrice_2_2['R1'] = 2;
    matrice_2_2['PD'] = 2.5;

    matrice_2_3 = new Array();
    matrice_2_3['nbTravees'] = 2;
    matrice_2_3['AV'] = 3;
    matrice_2_3['AR'] = 2.5;
    matrice_2_3['PG'] = 2.5;
    matrice_2_3['R1'] = 2;
    matrice_2_3['PD'] = 3;

    matrice_2_4 = new Array();
    matrice_2_4['nbTravees'] = 2;
    matrice_2_4['AV'] = 3;
    matrice_2_4['AR'] = 2.5;
    matrice_2_4['PG'] = 2;
    matrice_2_4['R1'] = 3;
    matrice_2_4['PD'] = 2;

    matrice_2_5 = new Array();
    matrice_2_5['nbTravees'] = 2;
    matrice_2_5['AV'] = 2.5;
    matrice_2_5['AR'] = 3;
    matrice_2_5['PG'] = 3;
    matrice_2_5['R1'] = 1.4;
    matrice_2_5['PD'] = 3;

    matrice_2_6 = new Array();
    matrice_2_6['nbTravees'] = 2;
    matrice_2_6['AV'] = 2.5;
    matrice_2_6['AR'] = 3;
    matrice_2_6['PG'] = 3;
    matrice_2_6['R1'] = 2;
    matrice_2_6['PD'] = 2.5;

    matrice_2_7 = new Array();
    matrice_2_7['nbTravees'] = 2;
    matrice_2_7['AV'] = 2.5;
    matrice_2_7['AR'] = 3;
    matrice_2_7['PG'] = 2.5;
    matrice_2_7['R1'] = 2;
    matrice_2_7['PD'] = 3;

    matrice_2_8 = new Array();
    matrice_2_8['nbTravees'] = 2;
    matrice_2_8['AV'] = 2.5;
    matrice_2_8['AR'] = 3;
    matrice_2_8['PG'] = 2;
    matrice_2_8['R1'] = 3;
    matrice_2_8['PD'] = 2;


    matrice_3_1 = new Array();
    matrice_3_1['nbTravees'] = 3;
    matrice_3_1['AV'] = 3;
    matrice_3_1['AR'] = 2.5;
    matrice_3_1['PG'] = 3;
    matrice_3_1['R1'] = 1.4;
    matrice_3_1['R2'] = 3;
    matrice_3_1['PD'] = 3;

    matrice_3_2 = new Array();
    matrice_3_2['nbTravees'] = 3;
    matrice_3_2['AV'] = 3;
    matrice_3_2['AR'] = 2.5;
    matrice_3_2['PG'] = 3;
    matrice_3_2['R1'] = 3;
    matrice_3_2['R2'] = 1.4;
    matrice_3_2['PD'] = 3;

    matrice_3_3 = new Array();
    matrice_3_3['nbTravees'] = 3;
    matrice_3_3['AV'] = 3;
    matrice_3_3['AR'] = 2.5;
    matrice_3_3['PG'] = 2.5;
    matrice_3_3['R1'] = 3;
    matrice_3_3['R2'] = 3;
    matrice_3_3['PD'] = 2.5;

    matrice_3_4 = new Array();
    matrice_3_4['nbTravees'] = 3;
    matrice_3_4['AV'] = 2.5;
    matrice_3_4['AR'] = 3;
    matrice_3_4['PG'] = 3;
    matrice_3_4['R1'] = 1.4;
    matrice_3_4['R2'] = 3;
    matrice_3_4['PD'] = 3;

    matrice_3_5 = new Array();
    matrice_3_5['nbTravees'] = 3;
    matrice_3_5['AV'] = 2.5;
    matrice_3_5['AR'] = 3;
    matrice_3_5['PG'] = 3;
    matrice_3_5['R1'] = 3;
    matrice_3_5['R2'] = 1.4;
    matrice_3_5['PD'] = 3;

    matrice_3_6 = new Array();
    matrice_3_6['nbTravees'] = 3;
    matrice_3_6['AV'] = 2.5;
    matrice_3_6['AR'] = 3;
    matrice_3_6['PG'] = 2.5;
    matrice_3_6['R1'] = 3;
    matrice_3_6['R2'] = 3;
    matrice_3_6['PD'] = 2.5;

    matrices.push(matrice_1);
    matrices.push(matrice_2_1);
    matrices.push(matrice_2_2);
    matrices.push(matrice_2_3);
    matrices.push(matrice_2_4);
    matrices.push(matrice_2_5);
    matrices.push(matrice_2_6);
    matrices.push(matrice_2_7);
    matrices.push(matrice_2_8);
    matrices.push(matrice_3_1);
    matrices.push(matrice_3_2);
    matrices.push(matrice_3_3);
    matrices.push(matrice_3_4);
    matrices.push(matrice_3_5);
    matrices.push(matrice_3_6);
}



/*******************************************    Petites fonctions utiles   ********************************************/

export function extraireNomTravee(objet) {
    return objet.substr(0, objet.indexOf('>'));
}

export function extraireFace(objet) {
    var face = objet.substr(objet.indexOf('>') + 1, objet.length);

    return face.substr(0, face.indexOf('>') > -1 ? face.indexOf('>') : face.length);
}


/******************   Fonctions métier   *****************/

export function retirerObjetModifiable(nomObjet) {
    for (var i = 0; i < objetsModifiables.length; i++) {
        if (objetsModifiables[i].name == nomObjet) {
            var objet = scene.getObjectByName(nomObjet);
            objetsModifiables.splice(i, 1);
            return;
        }
    }
}


function chercherOuverturesCandidates(scoreMinimum, murInterieur = false) {

    var typeOuverturesAutorisees = new Array();
    for (var produit in PRODUITS) {
        if ((produit != 'MU') && PRODUITS[produit]['VT'] >= scoreMinimum && PRODUITS[produit][murInterieur])
            typeOuverturesAutorisees.push(produit);
    }

    return typeOuverturesAutorisees;
}



function selectionnerMatrices(nomsTravees, rangTravee, nomFaceDansTravee) {

    /*  1 - On recherche les minimums pour cette face
        2 - On filtre parmi ces mini pour ne garder que ceux réalisables
        3 - On garde le min des minimums
        4 - On calcule le score actuel de la face, sans le mur que l'on souhaite remplacer
        5 - On calcule le delta entre le score et le minimum retenu, pour après déterminer les ouvertures possibles.    */

    var nbTraveesCourant = nomsTravees.length;
    var tableauMatricesMinimums = new Array();
    var tableauValeursMinimums = new Array();
    var minimumRetenu, scoreActuel, nomFaceAbsolue;

    // nomFaceDansTravee peut être : AV, AR, PDAV, PDAR, PGAV, PGAR
    // nomFaceAbsolue peut être : AV, AR, PD, PG, R1, R2 ou R3
    if (nomFaceDansTravee == 'AV' || nomFaceDansTravee == 'AR')
        nomFaceAbsolue = nomFaceDansTravee;
    else {
        if (nbTraveesCourant == 1)
            nomFaceAbsolue = (nomFaceDansTravee.includes('PG') ? 'PG' : 'PD');
        else {
            if (nomFaceDansTravee.includes('PG') && rangTravee == 1) nomFaceAbsolue = 'PG';
            else {
                if (nomFaceDansTravee.includes('PD') && rangTravee == nbTraveesCourant) nomFaceAbsolue = 'PD';
                else {
                    switch (nbTraveesCourant) {
                        case 2:
                            nomFaceAbsolue = 'R1';
                            break;
                        case 3:
                            if (rangTravee == 1 || (rangTravee == (nbTraveesCourant - 1) && nomFaceDansTravee.includes('PG'))) nomFaceAbsolue = 'R1';
                            if (rangTravee == nbTraveesCourant || (rangTravee == (nbTraveesCourant - 1) && nomFaceDansTravee.includes('PD'))) nomFaceAbsolue = 'R2';
                            break;
                        case 4:
                            if (rangTravee == 1 || (rangTravee == 2 && nomFaceDansTravee.includes('PG'))) nomFaceAbsolue = 'R1';
                            if ((rangTravee == 2 && nomFaceDansTravee.includes('PD')) || (rangTravee == (nbTraveesCourant - 1) && nomFaceDansTravee.includes('PG'))) nomFaceAbsolue = 'R2';
                            if (rangTravee == nbTraveesCourant || (rangTravee == (nbTraveesCourant - 1) && nomFaceDansTravee.includes('PD'))) nomFaceAbsolue = 'R3';
                            break;
                    }
                }
            }
        }
    }

    // 1 - On ne conserve que les matrices correspondant à notre nombre de travées.
    for (var matrice in matrices) {
        if (matrices[matrice]['nbTravees'] == nbTraveesCourant) {
            tableauMatricesMinimums.push(matrices[matrice]);
            if (!tableauValeursMinimums.includes(matrices[matrice][nomFaceAbsolue]))
                tableauValeursMinimums.push(matrices[matrice][nomFaceAbsolue]);
        }
    }
    tableauValeursMinimums.sort(function (a, b) {
        return a - b
    });
    if (DEBUG) {
        log('tabValeursMinimums = ');
        log(tableauValeursMinimums);
        log('tableauMatricesMinimums = ');
        log(tableauMatricesMinimums);
    }


    // On calcule les scores totaux VT de chaque face.
    var totalVtAV = 0,
        totalVtAR = 0,
        totalVtPG = 0,
        totalVtPD = 0,
        totalVtR1 = null,
        totalVtR2 = null,
        totalVtR3 = null;

    for (var i = 0; i < nbTraveesCourant; i++) {
        totalVtAV += parseFloat(tableauTravees[nomsTravees[i]]['vt_AV']);
        totalVtAR += parseFloat(tableauTravees[nomsTravees[i]]['vt_AR']);
    }
    totalVtPG = parseFloat(tableauTravees[nomsTravees[0]]['vt_PGAV'] + tableauTravees[nomsTravees[0]]['vt_PGAR']);
    totalVtPD = parseFloat(tableauTravees[nomsTravees[(nbTraveesCourant - 1)]]['vt_PDAV'] + tableauTravees[nomsTravees[(nbTraveesCourant - 1)]]['vt_PDAR']);
    totalVtR1 = parseFloat(tableauTravees[nomsTravees[0]]['vt_PDAV'] + tableauTravees[nomsTravees[0]]['vt_PDAR']);
    switch (nbTraveesCourant) {
        case 3:
            totalVtR2 = parseFloat(tableauTravees[nomsTravees[1]]['vt_PDAV'] + tableauTravees[nomsTravees[1]]['vt_PDAR']);
            break;
        case 4:
            totalVtR2 = parseFloat(tableauTravees[nomsTravees[1]]['vt_PDAV'] + tableauTravees[nomsTravees[1]]['vt_PDAR']);
            totalVtR3 = parseFloat(tableauTravees[nomsTravees[2]]['vt_PDAV'] + tableauTravees[nomsTravees[2]]['vt_PDAR']);
            break;
    }
    log('AV=' + totalVtAV + '/AR=' + totalVtAR + '/PG=' + totalVtPG + '/PD=' + totalVtPD + '/R1=' + totalVtR1 + '/R2=' + totalVtR2 + '/R3=' + totalVtR3);


    // 2 - On parcourt le tableau des matrices pour ne conserver que celles qui respectent les scores VT actuels.
    tableauValeursMinimums.forEach(function (valeur) {

        for (var matrice in tableauMatricesMinimums) {
            if (tableauMatricesMinimums[matrice][nomFaceAbsolue] == valeur) {

                // Pour les faces AV et AR, on regarde juste la face opposée.
                if (nomFaceAbsolue == 'AV') {
                    if (totalVtAR < tableauMatricesMinimums[matrice]['AR'])
                        delete tableauMatricesMinimums[matrice];
                } else {
                    if (nomFaceAbsolue == 'AR') {
                        if (totalVtAV < tableauMatricesMinimums[matrice]['AV'])
                            delete tableauMatricesMinimums[matrice];
                    } else {
                        // Pour une des faces PG, PD ou Rx, on regarde si les 2 autres faces respectent les valeurs, pour chaque matrice.
                        var aSupprimer = false;
                        if (nomFaceAbsolue == 'PG') {
                            if (totalVtPD < parseFloat(tableauMatricesMinimums[matrice]['PD'])) aSupprimer = aSupprimer || true;
                            if (totalVtR1 < parseFloat(tableauMatricesMinimums[matrice]['R1'])) aSupprimer = aSupprimer || true;
                            switch (nbTraveesCourant) {
                                case 3:
                                    if (totalVtR2 < parseFloat(tableauMatricesMinimums[matrice]['R2'])) aSupprimer = aSupprimer || true;
                                    break;
                                case 4:
                                    if (totalVtR2 < parseFloat(tableauMatricesMinimums[matrice]['R2'])) aSupprimer = aSupprimer || true;
                                    if (totalVtR3 < parseFloat(tableauMatricesMinimums[matrice]['R3'])) aSupprimer = aSupprimer || true;
                                    break;
                            }
                        }
                        if (aSupprimer)
                            delete tableauMatricesMinimums[matrice];
                    }
                }
            }
        }
    });

    // 3 - Dernier parcours du tableau pour conserver le minimum
    minimumRetenu = 999;
    for (var matrice in tableauMatricesMinimums) {
        if (tableauMatricesMinimums[matrice][nomFaceAbsolue] < minimumRetenu)
            minimumRetenu = tableauMatricesMinimums[matrice][nomFaceAbsolue];
    }

    // 4 - Calculer du score actuel (hors mur que l'on souhaite remplacer)
    scoreActuel = parseFloat(eval('totalVt' + nomFaceAbsolue));
    scoreActuel -= PRODUITS['MU']['VT'];

    // Pour vider un peu la mémoire
    tableauValeursMinimums.length = 0;
    tableauMatricesMinimums.length = 0;

    // 5 - On renvoie le delta entre score actuel et minimum (donc le score VT que l'ouverture doit dépasser).
    return Math.abs(minimumRetenu - scoreActuel);
}

export function verifierContraintes(objet) {

    var nomTravee = extraireNomTravee(objet);
    var nomFace = extraireFace(objet);
    var coteFace = 'exterieur';
    var numConstruction = tableauTravees[nomTravee]['numConstruction'];
    var traveesMemeConstruction = new Array();
    var typesOuverturesAutorisees = new Array();
    var nomPignon;

    if (nomFace.indexOf('PG') > -1) nomPignon = 'PG';
    else {
        if (nomFace.indexOf('PD') > -1) nomPignon = 'PD';
        else nomPignon = nomFace;
    }

    // On parcourt toutes les travées pour connaitre celles qui sont dans la même construction que la travée courante.
    for (var travee in tableauTravees) {
        if (tableauTravees[travee]['numConstruction'] == numConstruction) {
            traveesMemeConstruction.push(travee);
        }
    }


    // On calcule si la face est une face intérieure ou extérieure (pour pouvoir filtrer les types d'ouvertures proposées),
    // et on détermine le score minimum pour la face concernée.
    var delta = 0;

    switch (traveesMemeConstruction.length) {
        case 1:
            delta = matrice_1[nomPignon];
            break;
        case 3:
            if (tableauTravees[nomTravee]['rangDansConstruction'] == 2 && nomFace.includes('P')) coteFace = 'interieur';
            break;
        case 4:
            if (tableauTravees[nomTravee]['rangDansConstruction'] == 2 && nomFace.includes('P')) coteFace = 'interieur';
            if (tableauTravees[nomTravee]['rangDansConstruction'] == 3 && nomFace.includes('P')) coteFace = 'interieur';
            break;
    }
    if (traveesMemeConstruction.length > 1) {
        if (tableauTravees[nomTravee]['rangDansConstruction'] == 1 && nomFace.includes('PD')) coteFace = 'interieur';
        if (tableauTravees[nomTravee]['rangDansConstruction'] == traveesMemeConstruction.length && nomFace.includes('PG')) coteFace = 'interieur';

        delta = selectionnerMatrices(traveesMemeConstruction, tableauTravees[nomTravee]['rangDansConstruction'], nomFace);
    }
    typesOuverturesAutorisees = chercherOuverturesCandidates(delta, coteFace);

    if (DEBUG) {
        log('Delta entre score actuel du pignon et minimum = ' + delta);
        log('Types d\'ouvertures autorisées = ' + typesOuverturesAutorisees);
    }

    return typesOuverturesAutorisees;
}


export function initialiserScoresVT(nomTravee) {

    var vtMur = PRODUITS['MU']['VT'];

    tableauTravees[nomTravee]['vt_AR'] = vtMur;
    tableauTravees[nomTravee]['vt_PDAR'] = vtMur;
    tableauTravees[nomTravee]['vt_PDAV'] = vtMur;
    tableauTravees[nomTravee]['vt_AV'] = vtMur;
    tableauTravees[nomTravee]['vt_PGAV'] = vtMur;
    tableauTravees[nomTravee]['vt_PGAR'] = vtMur;
}


export function recalculerConstructions() {

    if (nbTravees > 0) {

        // On recalcule tout en partant de la première travée, qui sera la construction 1.
        var traveesParConstruction = 1;
        nbConstructions = 1;
        tableauTravees[PREFIXE_TRAVEE + 1]['numConstruction'] = 1;
        tableauTravees[PREFIXE_TRAVEE + 1]['rangDansConstruction'] = 1;

        for (var i = 2; i <= nbTravees; i++) {

            if (tableauTravees[PREFIXE_TRAVEE + i]['decalage'] != tableauTravees[PREFIXE_TRAVEE + parseInt(i - 1)]['decalage']) {
                // Nouvelle construction
                nbConstructions++;
                traveesParConstruction = 1;
                tableauTravees[PREFIXE_TRAVEE + i]['numConstruction'] = nbConstructions;
                tableauTravees[PREFIXE_TRAVEE + i]['rangDansConstruction'] = 1;
            } else {

                // Même décalage que la travée de gauche
                traveesParConstruction++;
                if (traveesParConstruction > NB_TRAVEES_MAXI) {
                    nbConstructions++;
                    traveesParConstruction = 1;
                    tableauTravees[PREFIXE_TRAVEE + i]['numConstruction'] = nbConstructions;
                    tableauTravees[PREFIXE_TRAVEE + i]['rangDansConstruction'] = 1;
                } else {
                    tableauTravees[PREFIXE_TRAVEE + i]['numConstruction'] = tableauTravees[PREFIXE_TRAVEE + parseInt(i - 1)]['numConstruction'];
                    tableauTravees[PREFIXE_TRAVEE + i]['rangDansConstruction'] = traveesParConstruction;
                }
            }
        }
    }
}



/*********************************************************************************************************************************/

$(document).ready(function () {

    $("#popup-ouverture").hide();
    $("#overlay").hide();
    $("#div-menu-contextuel").hide();

    initCaracteristiquesOuvertures();
    initMatricesScoreVT();

    var travee1 = creerTravee();
    scene.add(travee1);

    //    var firstWindow = creerOuverture(travee1.name, 'AV', 'F2');
    //    scene.add(firstWindow);

    //    var secondWindow = creerOuverture(travee1.name, 'PGAV', 'F1');
    //    scene.add(secondWindow); //
    //
    //    var firstDoor = creerOuverture(travee1.name, 'PDAR', 'PE');
    //    scene.add(firstDoor);
    //
    //    var secondDoor = creerOuverture(travee1.name, 'PGAR', 'PF', 2);
    //    scene.add(secondDoor);
    //
    //    var porteGarage = creerOuverture(travee1.name, 'AR', 'PG');
    //    scene.add(porteGarage);
    incrusterCotes();

    init();
    displayGui();
    animate();

    window.addEventListener('resize', onWindowResize, false);
    document.addEventListener('dblclick', onMouseClick);
    //document.addEventListener('mousemove', onMouseMove, false);
    //document.addEventListener('click', onMouseClick);

});
