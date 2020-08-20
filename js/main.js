import {
    GLTFLoader
} from './export/GLTFLoader.js';
import {
    GLTFExporter
} from './export/GLTFExporter.js';

import {
    renderer,
    camera,
    cameraOrtho
}
from "./environment.js"

import {
    onMouseClick,
    onMouseDoubleClick,
    onWindowResize,
    onMouseMove
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
    wallMaterial,
    textMaterial,
    createText,
} from "./materials.js"


// Fonctions communes
function render() {

    if (activeCamera === camera) {
        camera.fov = 50;
        camera.far = 600;
        camera.updateProjectionMatrix();
    } else {
        cameraOrtho.far = 300;
        cameraOrtho.updateProjectionMatrix();
    }
    renderer.clear();
    renderer.render(scene, activeCamera);
}



export function animate() {
    requestAnimationFrame(animate);
    render();
};


function init() {
    activeCamera = camera;
    controls = new THREE.OrbitControls(activeCamera, renderer.domElement);
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
    matrice_3_1, matrice_3_2, matrice_3_3, matrice_3_4, matrice_3_5, matrice_3_6,
    matrice_4_1, matrice_4_2, matrice_4_3, matrice_4_4, matrice_4_5, matrice_4_6, matrice_4_7, matrice_4_8;


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



export function traduireNomObjet(objet) {
    var nomTravee = extraireNomTravee(objet.name);
    var nomFace = extraireFace(objet.name);
    var traduction = nomTravee + " : ";

    // Gestion des murs
    if (!objet.parent.name.includes('>') && !objet.name.includes('plancher')) {
        var libelleFace;
        switch (nomFace) {
            case "AV":
                libelleFace = "avant";
                break;
            case "AR":
                libelleFace = "arrière";
                break;
            case "PGAV":
                libelleFace = "avant-gauche";
                break;
            case "PGAR":
                libelleFace = "arrière-gauche";
                break;
            case "PDAV":
                libelleFace = "avant-droite";
                break;
            case "PDAR":
                libelleFace = "arrière-droite";
                break;
        }
        traduction += "façade " + libelleFace;
    }

    // Gestion des pignons
    if (objet.name.includes('PINT')) {
        traduction += "pignon intérieur";
    }

    if (objet.name.includes('plancher')) {
        traduction += "plancher";
    }

    if (objet.name.includes('Ouverture ')) {
        if (objet.parent.name.includes('PE+F1')) {
            traduction += PRODUITS['PE+F1'].categorie + " " + PRODUITS['PE+F1'].codeModule;

        } else {
            var debut = objet.name.indexOf('Ouverture ');
            var module = objet.name.substring(debut + ('Ouverture ').length, objet.name.lastIndexOf('>'));
            traduction += PRODUITS[module].categorie + " " + PRODUITS[module].codeModule;
        }
    }

    return traduction;
}


/************************   Gestion des cotes affichées sur le plan   ***********************************************/

export function changerCouleurTextes(couleur) {
    var coteX, coteY;

    coteX = scene.getObjectByName('CoteX');
    coteX.children[0].material.color = couleur;
    coteX.children[1].material.color = couleur;

    coteY = scene.getObjectByName('CoteY');
    coteY.children[0].material.color = couleur;
    coteY.children[1].material.color = couleur;

    scene.traverse(function (child) {
        if (child.name.includes(">Incrustation"))
            child.geometry.color = couleur;
    });
}


export function incrusterCotes() {

    var texte, texteCotes, xTexte, decalage, nbDecalages = 0;
    var decalageActuel = tableauTravees['Travee 1'].decalage;
    var hauteurTexte = -(HAUTEUR_TRAVEE / 2) + 0.2;
    var cotesGrpX = new THREE.Group();

    scene.remove(scene.getObjectByName('CoteX'));
    scene.remove(scene.getObjectByName('CoteY'));

    // On recherche le changement de décalage, afin de déterminer le découpage horizontal et vertical des cotes.
    var derniereTraveeConstruction1 = 0,
        nbTraveesConstruction1 = 0;
    for (var laTravee in tableauTravees) {
        if (tableauTravees[laTravee].decalage != decalageActuel) nbDecalages++;
        if (tableauTravees[laTravee].numConstruction == 1) {
            nbTraveesConstruction1++;
            derniereTraveeConstruction1 = tableauTravees[laTravee].nom;
        }
    }
    if (nbDecalages > 0) {
        var premiereTraveeConstruction2 = 0,
            nbTraveesConstruction2 = 0,
            derniereTraveeConstruction2;
        for (var laTravee in tableauTravees) {
            if (tableauTravees[laTravee].numConstruction == 2) {
                nbTraveesConstruction2++;
                if (premiereTraveeConstruction2 == 0) premiereTraveeConstruction2 = tableauTravees[laTravee].nom;
                derniereTraveeConstruction2 = laTravee;
            }
        }
    }

    /************************      Calcul de la côte de largeur (en X)    ***********************/
    var points = [];
    decalage = tableauTravees['Travee 1'].positionX - (LARGEUR_TRAVEE / 2);
    points.push(new THREE.Vector3(decalage + 0.5, hauteurTexte, ((LONGUEUR_TRAVEE / 2)) + 1));
    points.push(new THREE.Vector3(decalage + 0.5, hauteurTexte, (LONGUEUR_TRAVEE / 2) + 10));
    decalage = tableauTravees[derniereTraveeConstruction1].positionX + (LARGEUR_TRAVEE / 2);
    points.push(new THREE.Vector3(decalage - 0.5, hauteurTexte, (LONGUEUR_TRAVEE / 2) + 10));
    points.push(new THREE.Vector3(decalage - 0.5, hauteurTexte, (LONGUEUR_TRAVEE / 2) + 1));
    var line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), textMaterial);
    cotesGrpX.add(line);

    texte = nbTraveesConstruction1 * (LARGEUR_TRAVEE * 100) + ' mm';
    texteCotes = createText(texte);
    texteCotes.name = "CoteX_1>texte";
    texteCotes.rotation.x = -Math.PI / 2;
    xTexte = (tableauTravees['Travee 1'].positionX + tableauTravees[derniereTraveeConstruction1].positionX) / 2;
    texteCotes.position.set(xTexte, hauteurTexte, (LONGUEUR_TRAVEE / 2) + 13);
    cotesGrpX.add(texteCotes);

    // On prend en compte un décalage éventuel de la première construction, et donc de la cote suivant Y.
    switch (tableauTravees['Travee 1'].decalage) {
        case 1:
            line.position.z += LONGUEUR_TRAVEE / 2;
            texteCotes.position.z += LONGUEUR_TRAVEE / 2;
            break;
        case -1:
            line.position.z -= LONGUEUR_TRAVEE / 2;
            texteCotes.position.z -= LONGUEUR_TRAVEE / 2;
            break;
    }


    // En fonction du nombre de décalages, on a une ou plusieurs cotes X.
    if (nbDecalages > 0) {
        var points = [];
        decalage = tableauTravees[premiereTraveeConstruction2].positionX - (LARGEUR_TRAVEE / 2);
        points.push(new THREE.Vector3(decalage + 0.5, hauteurTexte, (LONGUEUR_TRAVEE / 2) + 1));
        points.push(new THREE.Vector3(decalage + 0.5, hauteurTexte, (LONGUEUR_TRAVEE / 2) + 10));
        decalage = tableauTravees[PREFIXE_TRAVEE + nbTravees].positionX + (LARGEUR_TRAVEE / 2);
        points.push(new THREE.Vector3(decalage - 0.5, hauteurTexte, (LONGUEUR_TRAVEE / 2) + 10));
        points.push(new THREE.Vector3(decalage - 0.5, hauteurTexte, (LONGUEUR_TRAVEE / 2) + 1));
        var line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), textMaterial);
        cotesGrpX.add(line);

        texte = nbTraveesConstruction2 * (LARGEUR_TRAVEE * 100) + ' mm';
        texteCotes = createText(texte);
        texteCotes.name = "CoteX_2>texte";
        texteCotes.rotation.x = -Math.PI / 2;
        xTexte = (tableauTravees[premiereTraveeConstruction2].positionX + tableauTravees[PREFIXE_TRAVEE + nbTravees].positionX) / 2;
        texteCotes.position.set(xTexte, hauteurTexte, (LONGUEUR_TRAVEE / 2) + 13);
        cotesGrpX.add(texteCotes);

        // En fonction du décalage éventuel de la première construction, on peut décaler suivant Y.
        switch (tableauTravees[premiereTraveeConstruction2].decalage) {
            case 1:
                line.position.z += LONGUEUR_TRAVEE / 2;
                texteCotes.position.z += LONGUEUR_TRAVEE / 2;
                break;
            case -1:
                line.position.z -= LONGUEUR_TRAVEE / 2;
                texteCotes.position.z -= LONGUEUR_TRAVEE / 2;
                break;
        }
    }
    cotesGrpX.name = 'CoteX';
    cotesGrpX.visible = true;
    scene.add(cotesGrpX);


    /************************      Calcul de la côte de profondeur (en Y)    ***********************/
    decalage = tableauTravees['Travee 1'].positionX - (LARGEUR_TRAVEE / 2);
    var texte = (LONGUEUR_TRAVEE * 100) + ' mm';
    var texteCotes = createText(texte);
    var hauteurTexte = -(HAUTEUR_TRAVEE / 2) + 0.2;
    var cotesGrpY = new THREE.Group();
    texteCotes.rotation.z = -Math.PI / 2;
    texteCotes.rotation.x = Math.PI / 2;
    texteCotes.rotation.y = Math.PI;
    texteCotes.position.set(decalage - 13, hauteurTexte, 0);
    texteCotes.name = "CoteY_1>texte";
    cotesGrpY.add(texteCotes);

    var points = [];
    points.push(new THREE.Vector3(decalage - 1, hauteurTexte, LONGUEUR_TRAVEE / 2 - 0.5));
    points.push(new THREE.Vector3(decalage - 10, hauteurTexte, LONGUEUR_TRAVEE / 2 - 0.5));
    points.push(new THREE.Vector3(decalage - 10, hauteurTexte, -LONGUEUR_TRAVEE / 2 + 0.5));
    points.push(new THREE.Vector3(decalage - 1, hauteurTexte, -LONGUEUR_TRAVEE / 2 + 0.5));
    var line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), textMaterial);
    cotesGrpY.add(line);

    // On prend en compte un décalage éventuel de la première construction, et donc de la cote suivant Y.
    switch (tableauTravees['Travee 1'].decalage) {
        case 1:
            line.position.z += LONGUEUR_TRAVEE / 2;
            texteCotes.position.z += LONGUEUR_TRAVEE / 2;
            break;
        case -1:
            line.position.z -= LONGUEUR_TRAVEE / 2;
            texteCotes.position.z -= LONGUEUR_TRAVEE / 2;
            break;
    }

    if (nbDecalages > 0) {
        decalage = tableauTravees[derniereTraveeConstruction2].positionX + (LARGEUR_TRAVEE / 2);
        var texte = (LONGUEUR_TRAVEE * 100) + ' mm';
        var texteCotes = createText(texte);
        var hauteurTexte = -(HAUTEUR_TRAVEE / 2) + 0.2;
        var cotesGrp = new THREE.Group();
        texteCotes.rotation.z = -Math.PI / 2;
        texteCotes.rotation.x = Math.PI / 2;
        texteCotes.rotation.y = Math.PI;
        texteCotes.position.set(decalage + 13, hauteurTexte, 0);
        texteCotes.name = "CoteY_2>texte";
        cotesGrpY.add(texteCotes);

        var points = [];
        points.push(new THREE.Vector3(decalage + 1, hauteurTexte, LONGUEUR_TRAVEE / 2 - 0.5));
        points.push(new THREE.Vector3(decalage + 10, hauteurTexte, LONGUEUR_TRAVEE / 2 - 0.5));
        points.push(new THREE.Vector3(decalage + 10, hauteurTexte, -LONGUEUR_TRAVEE / 2 + 0.5));
        points.push(new THREE.Vector3(decalage + 1, hauteurTexte, -LONGUEUR_TRAVEE / 2 + 0.5));
        var line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), textMaterial);
        cotesGrpY.add(line);

        // On prend en compte un décalage éventuel de la première construction, et donc de la cote suivant Y.
        switch (tableauTravees[derniereTraveeConstruction2].decalage) {
            case 1:
                line.position.z += LONGUEUR_TRAVEE / 2;
                texteCotes.position.z += LONGUEUR_TRAVEE / 2;
                break;
            case -1:
                line.position.z -= LONGUEUR_TRAVEE / 2;
                texteCotes.position.z -= LONGUEUR_TRAVEE / 2;
                break;
        }
    }

    cotesGrpY.name = 'CoteY';
    cotesGrpY.visible = true;
    scene.add(cotesGrpY);

}


export function hideIncrustations() {
    scene.traverse(function (child) {
        if (child.name.includes(">Incrustation")) {
            child.visible = false;
        }
    });
}


export function showIncrustations() {
    scene.traverse(function (child) {
        if (child.name.includes(">Incrustation")) {

            // Ssi le module auquel est rattachée l'incrustation est visible, alors on affiche l'incrustation
            var moduleLie = scene.getObjectByName(child.name.substr(0, child.name.lastIndexOf('>')));
            if (moduleLie.visible)
                child.visible = true;
            else
                child.visible = false;
        }
    });
}

export function mergeGroups(porte, fenetre) {
    var newGroup = new THREE.Group();
    var rotationX, rotationY, rotationZ, positionX, positionY, positionZ;

    rotationX = porte.rotation.x;
    rotationY = porte.rotation.y;
    rotationZ = porte.rotation.z;
    positionX = porte.position.x;
    positionY = porte.position.y;
    positionZ = porte.position.z;

    porte.children.forEach(function (child) {
        var clone = child.clone();
        newGroup.add(clone);
    });
    newGroup.children[0].position.x += 5.4;
    newGroup.children[1].position.x += 5.4;

    fenetre.children.forEach(function (child) {
        var clone = child.clone();
        newGroup.add(clone);
    });
    newGroup.children[2].position.x -= 7.78;
    newGroup.children[3].position.x -= 7.78;
    newGroup.children[2].position.y += 7.4;
    newGroup.children[3].position.y += 7.4;

    newGroup.rotation.x = rotationX;
    newGroup.rotation.y = rotationY;
    newGroup.rotation.z = rotationZ;
    newGroup.position.x = positionX;
    newGroup.position.y = positionY;
    newGroup.position.z = positionZ;

    return newGroup;
}


/************************   Initialisation de tableaux utiles   ***********************************************/

function initCaracteristiquesOuvertures() {

    // Tableau fixe des produits
    var nbCaract = 9;
    PRODUITS['MU'] = new Array(nbCaract); // ScoreVT, largeur, hauteur, epaisseur, distance du sol
    PRODUITS['MU']['VT'] = 3;
    PRODUITS['MU']['largeur'] = PRODUITS['MU']['hauteur'] = PRODUITS['MU']['elevation'] = 0;
    PRODUITS['MU']['interieur'] = PRODUITS['MU']['exterieur'] = true;
    PRODUITS['MU']['epaisseur'] = 2;
    PRODUITS['MU']['codeModule'] = 'MPL';
    PRODUITS['MU']['categorie'] = 'Mur';
    PRODUITS['MU']['libelleModule'] = 'Mur plein';

    PRODUITS['PE'] = new Array(nbCaract);
    PRODUITS['PE']['VT'] = 2;
    PRODUITS['PE']['largeur'] = 9;
    PRODUITS['PE']['hauteur'] = 21.5;
    PRODUITS['PE']['epaisseur'] = 3;
    PRODUITS['PE']['elevation'] = 0.3;
    PRODUITS['PE']['interieur'] = true;
    PRODUITS['PE']['exterieur'] = true;
    PRODUITS['PE']['decalageX'] = 0.1;
    PRODUITS['PE']['codeModule'] = 'MPE';
    PRODUITS['PE']['categorie'] = "Porte d'entrée";
    PRODUITS['PE']['libelleModule'] = 'Porte entrée 90x215';

    PRODUITS['F1'] = new Array(nbCaract);
    PRODUITS['F1']['VT'] = 2;
    PRODUITS['F1']['largeur'] = 4.5;
    PRODUITS['F1']['hauteur'] = 6.5;
    PRODUITS['F1']['epaisseur'] = 3;
    PRODUITS['F1']['elevation'] = 14.8;
    PRODUITS['F1']['interieur'] = false;
    PRODUITS['F1']['exterieur'] = true;
    PRODUITS['F1']['decalageX'] = -8.8;
    PRODUITS['F1']['codeModule'] = 'MF1';
    PRODUITS['F1']['categorie'] = 'Fenêtre';
    PRODUITS['F1']['libelleModule'] = 'Fenêtre 45x65';

    PRODUITS['F2'] = new Array(nbCaract);
    PRODUITS['F2']['VT'] = 2;
    PRODUITS['F2']['largeur'] = 10.5;
    PRODUITS['F2']['hauteur'] = 11.5;
    PRODUITS['F2']['epaisseur'] = 3;
    PRODUITS['F2']['elevation'] = 10;
    PRODUITS['F2']['interieur'] = false;
    PRODUITS['F2']['exterieur'] = true;
    PRODUITS['F2']['decalageX'] = -0.5;
    PRODUITS['F2']['codeModule'] = 'MF2';
    PRODUITS['F2']['categorie'] = 'Fenêtre';
    PRODUITS['F2']['libelleModule'] = 'Fenêtre 105x115';

    PRODUITS['PF'] = new Array(nbCaract);
    PRODUITS['PF']['VT'] = 1.4;
    PRODUITS['PF']['largeur'] = 18;
    PRODUITS['PF']['hauteur'] = 21.5;
    PRODUITS['PF']['epaisseur'] = 3;
    PRODUITS['PF']['elevation'] = 0;
    PRODUITS['PF']['interieur'] = true;
    PRODUITS['PF']['exterieur'] = true;
    PRODUITS['PF']['decalageX'] = -0.5;
    PRODUITS['PF']['codeModule'] = 'MPF';
    PRODUITS['PF']['categorie'] = 'Porte-fenêtre';
    PRODUITS['PF']['libelleModule'] = 'Porte fenêtre 180x215';

    PRODUITS['PG1'] = new Array(nbCaract);
    PRODUITS['PG1']['VT'] = 0;
    PRODUITS['PG1']['largeur'] = 24;
    PRODUITS['PG1']['hauteur'] = 20;
    PRODUITS['PG1']['epaisseur'] = 3;
    PRODUITS['PG1']['elevation'] = 0;
    PRODUITS['PG1']['interieur'] = false;
    PRODUITS['PG1']['exterieur'] = true;
    PRODUITS['PG1']['decalageX'] = 0.5;
    PRODUITS['PG1']['codeModule'] = 'MPG1';
    PRODUITS['PG1']['categorie'] = 'Porte de garage';
    PRODUITS['PG1']['libelleModule'] = 'Porte de garage 240x200';

    PRODUITS['PG2'] = new Array(nbCaract);
    PRODUITS['PG2']['VT'] = 3;
    PRODUITS['PG2']['largeur'] = 24;
    PRODUITS['PG2']['hauteur'] = 20;
    PRODUITS['PG2']['epaisseur'] = 3;
    PRODUITS['PG2']['elevation'] = -1;
    PRODUITS['PG2']['interieur'] = false;
    PRODUITS['PG2']['exterieur'] = true;
    PRODUITS['PG2']['decalageX'] = 2.5;
    PRODUITS['PG2']['codeModule'] = 'MPG2';
    PRODUITS['PG2']['categorie'] = 'Porte de garage';
    PRODUITS['PG2']['libelleModule'] = 'Porte garage renforcée 240x200';

    PRODUITS['PE+F1'] = new Array(nbCaract);
    PRODUITS['PE+F1']['VT'] = 0.5;
    PRODUITS['PE+F1']['largeur'] = 0;
    PRODUITS['PE+F1']['hauteur'] = 0;
    PRODUITS['PE+F1']['epaisseur'] = 0;
    PRODUITS['PE+F1']['elevation'] = 0;
    PRODUITS['PE+F1']['interieur'] = false;
    PRODUITS['PE+F1']['exterieur'] = true;
    PRODUITS['PE+F1']['decalageX'] = 0;
    PRODUITS['PE+F1']['codeModule'] = 'MPEF';
    PRODUITS['PE+F1']['categorie'] = 'Porte fenêtre + fenêtre';
    PRODUITS['PE+F1']['libelleModule'] = 'Porte entrée + fenêtre 45x65';

    PRODUITS['PO'] = new Array(nbCaract);
    PRODUITS['PO']['VT'] = 0;
    PRODUITS['PO']['largeur'] = 36;
    PRODUITS['PO']['hauteur'] = 25;
    PRODUITS['PO']['epaisseur'] = 3;
    PRODUITS['PO']['elevation'] = 10.5;
    PRODUITS['PO']['interieur'] = true;
    PRODUITS['PO']['exterieur'] = false;
    PRODUITS['PO']['decalageX'] = 0;
    PRODUITS['PO']['codeModule'] = 'MPI';
    PRODUITS['PO']['categorie'] = 'Portique intérieur';
    PRODUITS['PO']['libelleModule'] = 'Portique intérieur';
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

    matrice_4_1 = new Array();
    matrice_4_1['nbTravees'] = 4;
    matrice_4_1['AV'] = 3;
    matrice_4_1['AR'] = 2.5;
    matrice_4_1['PG'] = 3;
    matrice_4_1['R1'] = 3;
    matrice_4_1['R2'] = 2;
    matrice_4_1['R3'] = 2;
    matrice_4_1['PD'] = 3;

    matrice_4_2 = new Array();
    matrice_4_2['nbTravees'] = 4;
    matrice_4_2['AV'] = 3;
    matrice_4_2['AR'] = 2.5;
    matrice_4_2['PG'] = 3;
    matrice_4_2['R1'] = 2;
    matrice_4_2['R2'] = 3;
    matrice_4_2['R3'] = 2;
    matrice_4_2['PD'] = 3;

    matrice_4_3 = new Array();
    matrice_4_3['nbTravees'] = 4;
    matrice_4_3['AV'] = 3;
    matrice_4_3['AR'] = 2.5;
    matrice_4_3['PG'] = 3;
    matrice_4_3['R1'] = 2;
    matrice_4_3['R2'] = 2;
    matrice_4_3['R3'] = 3;
    matrice_4_3['PD'] = 3;

    matrice_4_4 = new Array();
    matrice_4_4['nbTravees'] = 4;
    matrice_4_4['AV'] = 3;
    matrice_4_4['AR'] = 2.5;
    matrice_4_4['PG'] = 2.5;
    matrice_4_4['R1'] = 3;
    matrice_4_4['R2'] = 3;
    matrice_4_4['R3'] = 2;
    matrice_4_4['PD'] = 2.5;

    matrice_4_5 = new Array();
    matrice_4_5['nbTravees'] = 4;
    matrice_4_5['AV'] = 2.5;
    matrice_4_5['AR'] = 3;
    matrice_4_5['PG'] = 3;
    matrice_4_5['R1'] = 3;
    matrice_4_5['R2'] = 2;
    matrice_4_5['R3'] = 2;
    matrice_4_5['PD'] = 3;

    matrice_4_6 = new Array();
    matrice_4_6['nbTravees'] = 4;
    matrice_4_6['AV'] = 2.5;
    matrice_4_6['AR'] = 3;
    matrice_4_6['PG'] = 3;
    matrice_4_6['R1'] = 2;
    matrice_4_6['R2'] = 3;
    matrice_4_6['R3'] = 2;
    matrice_4_6['PD'] = 3;

    matrice_4_7 = new Array();
    matrice_4_7['nbTravees'] = 4;
    matrice_4_7['AV'] = 2.5;
    matrice_4_7['AR'] = 3;
    matrice_4_7['PG'] = 3;
    matrice_4_7['R1'] = 2;
    matrice_4_7['R2'] = 2;
    matrice_4_7['R3'] = 3;
    matrice_4_7['PD'] = 3;

    matrice_4_8 = new Array();
    matrice_4_8['nbTravees'] = 4;
    matrice_4_8['AV'] = 2.5;
    matrice_4_8['AR'] = 3;
    matrice_4_8['PG'] = 2.5;
    matrice_4_8['R1'] = 3;
    matrice_4_8['R2'] = 3;
    matrice_4_8['R3'] = 2;
    matrice_4_8['PD'] = 2.5;

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
    matrices.push(matrice_4_1);
    matrices.push(matrice_4_2);
    matrices.push(matrice_4_3);
    matrices.push(matrice_4_4);
    matrices.push(matrice_4_5);
    matrices.push(matrice_4_6);
    matrices.push(matrice_4_7);
    matrices.push(matrice_4_8);
}


/*******************************************    Petites fonctions utiles   ********************************************/

export function extraireNomTravee(objet) {
    return objet.substr(0, objet.indexOf('>'));
}

export function extraireFace(objet) {
    var face = objet.substr(objet.indexOf('>') + 1, objet.length);

    return face.substr(0, face.indexOf('>') > -1 ? face.indexOf('>') : face.length);
}


export function modifierIncrustation(travee, face, remplacant = null) {

    var groupe = scene.getObjectByName(travee);
    var nbEnfants = groupe.children.length;

    for (var i = nbEnfants - 1; i >= 0; i--) {
        if (groupe.children[i].name.includes(">" + face + ">Incrustation")) {
            var positionX = groupe.children[i].position.x;
            var positionY = groupe.children[i].position.y;
            var positionZ = groupe.children[i].position.z;
            groupe.remove(groupe.children[i]);

            if (remplacant != null) {
                var nouvelleIncrustation = createText(remplacant, taillePoliceIncrustations);
                nouvelleIncrustation.rotation.x = -Math.PI / 2;
                nouvelleIncrustation.position.set(positionX, positionY, positionZ);
                nouvelleIncrustation.name = travee + ">" + face + ">Incrustation";
                nouvelleIncrustation.visible = false;
                groupe.add(nouvelleIncrustation);
            }
            return;
        }
    }
}


export function redimensionnerIncrustations() {

    var nouvelleTaille = calculerTaillePoliceOptimale();
    var positionX, positionY, positionZ;
    var rotationX, rotationY, rotationZ;

    var aTraiter = new Array();
    scene.traverse(function (child) {
        if (child.geometry && child.geometry.type == "TextGeometry")
            aTraiter.push(child.name);
    });

    aTraiter.forEach(function (item) {
        var child = scene.getObjectByName(item);
        var nomTravee = child.parent.name,
            travee;

        var nouveauTexte = createText(child.geometry.parameters.text, nouvelleTaille);
        positionX = child.position.x;
        positionY = child.position.y;
        positionZ = child.position.z;
        rotationX = child.rotation.x;
        rotationY = child.rotation.y;
        rotationZ = child.rotation.z;

        travee = scene.getObjectByName(nomTravee);
        travee.remove(child);

        nouveauTexte.name = item;
        nouveauTexte.position.set(positionX, positionY, positionZ);
        nouveauTexte.rotation.set(rotationX, rotationY, rotationZ);
        travee.add(nouveauTexte);
    });
}


export function calculerTaillePoliceOptimale() {
    var nouvelleTaille = 2;
    var zoom = cameraOrtho.zoom.toPrecision(1);

    if (DEBUG) log("Zoom caméra = " + zoom);

    switch (nbTravees) {
        case 1:
            nouvelleTaille = 2;
            break;
        case 2:
            nouvelleTaille = 2;
            break;
        case 3:
            nouvelleTaille = 2;
            break;
        case 4:
            nouvelleTaille = 2;
            break;
        case 5:
            nouvelleTaille = 3;
            break;
        case 6:
            nouvelleTaille = 3;
            break;
        case 7:
            nouvelleTaille = 3;
            break;
        case 8:
            nouvelleTaille = 4;
            break;
    }
    if (zoom <= 0.6 && zoom > 0.3)
        nouvelleTaille += 1;

    if (zoom <= 0.3)
        nouvelleTaille += 2;

    if (zoom <= 0.1)
        nouvelleTaille += 3;

    return nouvelleTaille;
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
        if ((produit != 'MU') && (PRODUITS[produit]['VT'] >= scoreMinimum) && (PRODUITS[produit][murInterieur])) typeOuverturesAutorisees.push(produit);
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

    // Attention : sur les murs intérieurs, c'est la travée PG qui porte les scores VT.
    if (nbTraveesCourant > 1)
        totalVtR1 = parseFloat(tableauTravees[nomsTravees[1]]['vt_PGAV'] + tableauTravees[nomsTravees[1]]['vt_PGAR']);
    if (nbTraveesCourant > 2)
        totalVtR2 = parseFloat(tableauTravees[nomsTravees[2]]['vt_PGAV'] + tableauTravees[nomsTravees[2]]['vt_PGAR']);
    if (nbTraveesCourant > 3)
        totalVtR3 = parseFloat(tableauTravees[nomsTravees[3]]['vt_PGAV'] + tableauTravees[nomsTravees[3]]['vt_PGAR']);

    if (DEBUG)
        log('Liste des scores VT actuels : AV=' + totalVtAV + '/AR=' + totalVtAR + '/PG=' + totalVtPG + '/PD=' + totalVtPD + '/R1=' + totalVtR1 + '/R2=' + totalVtR2 + '/R3=' + totalVtR3);


    // 2 - On parcourt le tableau des matrices pour ne conserver que celles qui respectent les scores VT actuels.
    tableauValeursMinimums.forEach(function (valeur) {

        for (var matrice in tableauMatricesMinimums) {
            if (tableauMatricesMinimums[matrice][nomFaceAbsolue] == valeur) {

                /*
                Pour les faces AV et AR, on regarde juste la face opposée mais ATTENTION, le score VT minimum est valable sur la somme de toutes les faces AV (ou AR) de la même construction et non pas pour chaque face (AV ou AR) de la construction (ex. d'une construction à 2 travées au même niveau : le VT minimum pour TOUTE la facade AV est de 3 ou 2.5, pas 3+3)
                */
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
                        //                        if (nomFaceAbsolue == 'PG') {
                        if (totalVtPG < parseFloat(tableauMatricesMinimums[matrice]['PG'])) aSupprimer = aSupprimer || true;
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
                        //                        }
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
    //    return Math.abs(minimumRetenu - scoreActuel);
    return (minimumRetenu - scoreActuel);
}


export function faceInterieureOuExterieure(objetSelectionne) {

    var travee = extraireNomTravee(objetSelectionne);
    var numTravee = parseInt(travee.substr(travee.indexOf(' ') + 1, 2));
    var face = extraireFace(objetSelectionne);
    var numConstruction = tableauTravees[travee]['numConstruction'];
    var traveesMemeConstruction = new Array();
    var resultat = 'interieur';

    // On parcourt toutes les travées pour connaitre celles qui sont dans la même construction que la travée courante.
    for (var uneTravee in tableauTravees) {
        if (tableauTravees[uneTravee]['numConstruction'] == numConstruction) {
            traveesMemeConstruction.push(uneTravee);
        }
    }

    // Cas simples : une seule travée ou bien face avant ou arrière --> extérieur
    if (nbTravees == 1 || face == "AV" || face == "AR") return 'exterieur';

    // Autres cas simples : murs des travées extrêmes --> extérieur
    if ((tableauTravees[travee]['rangDansConstruction'] == 1 && face.includes('PG')) ||
        (tableauTravees[travee]['rangDansConstruction'] == traveesMemeConstruction.length && face.includes('PD')))
        resultat = 'exterieur';

    // Plus compliqué : en cas de décalage entre deux travées, pour un même mur, il y aura un module en face extérieure et l'autre en face intérieure.
    if (face.includes('PG')) {
        var nomTraveeGauche = travee.substr(0, travee.indexOf(' ') + 1) + (numTravee - 1);
        var traveeGauche = scene.getObjectByName(nomTraveeGauche);
        if (traveeGauche) {
            var decalage = tableauTravees[travee]['decalage'] - tableauTravees[nomTraveeGauche]['decalage'];
            if ((decalage > 0) && face.includes("AR")) resultat = 'interieur'
            if ((decalage < 0) && face.includes("AV")) resultat = 'interieur';
        }

    } else if (face.includes('PD')) {
        var nomTraveeDroite = travee.substr(0, travee.indexOf(' ') + 1) + (numTravee + 1);
        var traveeDroite = scene.getObjectByName(nomTraveeDroite);
        if (traveeDroite) {
            var decalage = tableauTravees[travee]['decalage'] - tableauTravees[nomTraveeDroite]['decalage'];
            if ((decalage > 0) && face.includes("AR")) resultat = 'interieur'
            if ((decalage < 0) && face.includes("AV")) resultat = 'interieur';
        }
    }

    return resultat;
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


    /* On calcule si la face est une face intérieure ou extérieure (pour pouvoir filtrer les types
       d'ouvertures proposées), et on détermine le score minimum pour la face concernée. */
    var delta = 0;

    if (traveesMemeConstruction.length == 1) {
        var scoreActuel = 0;
        switch (nomPignon) {
            case 'PG':
                scoreActuel = tableauTravees[nomTravee]['vt_PGAV'] + tableauTravees[nomTravee]['vt_PGAR'];
                break;
            case 'PD':
                scoreActuel = tableauTravees[nomTravee]['vt_PDAV'] + tableauTravees[nomTravee]['vt_PDAR'];
                break;
            default:
                scoreActuel = tableauTravees[nomTravee]['vt_' + nomPignon];
                break;
        }
        scoreActuel -= PRODUITS['MU']['VT'];;
        delta = parseFloat(matrice_1[nomPignon]) - parseFloat(scoreActuel);
    } else {
        delta = selectionnerMatrices(traveesMemeConstruction, tableauTravees[nomTravee]['rangDansConstruction'], nomFace);
    }
    coteFace = faceInterieureOuExterieure(objet);
    typesOuverturesAutorisees = chercherOuverturesCandidates(delta, coteFace);

    // Cas particulier du MPG2 : on ne le propose qu'en façade, et uniquement pour les constructions à 1 ou 2 travées.
    if (typesOuverturesAutorisees.indexOf("PG2") > -1) {
        var aSupprimer = false;
        if (nomFace != "AV" && nomFace != "AR")
            aSupprimer = true;
        else {
            if (traveesMemeConstruction.length > 2)
                aSupprimer = true;
        }

        if (aSupprimer)
            typesOuverturesAutorisees.splice(5, 1);
    }

    if (DEBUG) {
        log('Score actuel du pignon complet = ' + scoreActuel + ' / Delta = ' + delta);
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


export function simulerCalculConstructions(tableauDecalages) {
    return recalculerConstructions(tableauDecalages);
}

export function recalculerConstructions(tableauDecalages = null) {

    if (nbTravees > 0) {

        var nbTraveesParConstruction = 0;
        var nbMaxTravees = 0;

        // Mode "simulation"
        if (tableauDecalages != null) {
            var resultatSimulation = 1;
            for (var i = 1; i < tableauDecalages.length; i++) {
                nbTraveesParConstruction++;
                if (tableauDecalages[i] != tableauDecalages[i - 1]) {
                    resultatSimulation++;
                    if (nbTraveesParConstruction > nbMaxTravees) nbMaxTravees = nbTraveesParConstruction;
                    nbTraveesParConstruction = 0;
                }
            }
            return [resultatSimulation, nbMaxTravees];

        } else {

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
}



/*********************************************************************************************************************************/

$(document).ready(function () {

    $(".popup-ouverture").hide();
    $("#div-menu-contextuel").hide();
    $("#vue-aerienne").hide();
    $("#popup-attente").hide();
    $("#overlay").hide();
    $("#transparent-overlay").hide();

    initCaracteristiquesOuvertures();
    initMatricesScoreVT();

    var travee1 = creerTravee();
    scene.add(travee1);

    incrusterCotes();

    init();
    displayGui();
    animate();

    window.addEventListener('resize', onWindowResize, false);
    document.addEventListener('dblclick', onMouseDoubleClick);
    document.addEventListener('click', onMouseClick);
    //    document.addEventListener('mousemove', onMouseMove, false);

});



/**********************************************************************************************************/


export function importScene(inp) {
    var loader = new GLTFLoader();
    loader.load(
        "./js/import/scene.gltf",
        function (gltf) {

            gltf.scene.traverse(function (child) {
                if (child.name.includes('Travee')) {
                    var newName = child.name.replace("Travee_", "Travee ");
                    child.name = newName;

                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }

                    scene.add(child);
                }
            });
        },
        function (xhr) {
            // called while loading is progressing
            console.log((xhr.loaded / xhr.total * 100) + '% loaded');
        },
        function (error) {
            // called when loading has errors
            console.log('An error happened');
        }
    );
    incrusterCotes();
    console.log(scene);
}

export function exportScene() {
    var exporter = new GLTFExporter();
    var options = {
        trs: true,
        onlyVisible: false,
        truncateDrawRange: false,
        embedImages: false
    };

    // On exporte toute la scène.... on fera le tri à l'import
    exporter.parse(scene, function (gltf) {

        if (gltf instanceof ArrayBuffer) {
            saveArrayBuffer(gltf, 'scene.glb');
        } else {
            var output = JSON.stringify(gltf, null, 2);
            saveString(output, 'scene.gltf');
        }

        console.log(scene);

    }, options);
}
