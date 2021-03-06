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
    onMouseMove,
    keyPressed
} from "./events.js"

import {
    displayGui,
    unSelect
} from "./gui.js"

import {
    creerOuverture,
    creerComboOuvertures,
    creerToit,
    creerTravee,
    decalerTravee,
    traitementCreationTravee,
    traitementCreationOuverture,
    selectionnerSolivage
} from "./objects.js"

import {
    wallMaterial,
    textMaterial,
    PINT_Gauche_Material,
    PINT_Droite_Material,
    createText,
} from "./materials.js"



// Quelques variables globales
var URL_DEVIS = "https://devis.econologis.fr";

// Quelques constantes utiles
export var URL_JSREPORT = "https://report.econologis.fr:5489";


// Fonctions communes
function render() {

    if (activeCamera === camera) {
        camera.fov = 50;
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
export function alerte(message, timeOut = 3000) {
    $("#message-alerte").prop("class", "alerte");
    $("#message-alerte").html(message);
    setTimeout(function () {
        $("#message-alerte").prop("class", "normal");
        $("#message-alerte").html("");
    }, timeOut);
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
        }, 3000);
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
    points.push(new THREE.Vector3(decalage + 0.5, hauteurTexte, (LONGUEUR_TRAVEE / 2) + 6));
    decalage = tableauTravees[derniereTraveeConstruction1].positionX + (LARGEUR_TRAVEE / 2);
    points.push(new THREE.Vector3(decalage - 0.5, hauteurTexte, (LONGUEUR_TRAVEE / 2) + 6));
    points.push(new THREE.Vector3(decalage - 0.5, hauteurTexte, (LONGUEUR_TRAVEE / 2) + 1));
    var line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), textMaterial);
    cotesGrpX.add(line);

    texte = "Construction 1 : " + nbTraveesConstruction1 * (LARGEUR_TRAVEE * 100) + ' mm';
    texteCotes = createText(texte);
    texteCotes.name = "CoteX_1>texte";
    texteCotes.rotation.x = -Math.PI / 2;
    xTexte = (tableauTravees['Travee 1'].positionX + tableauTravees[derniereTraveeConstruction1].positionX) / 2;
    texteCotes.position.set(xTexte, hauteurTexte, (LONGUEUR_TRAVEE / 2) + 9);
    cotesGrpX.add(texteCotes);

    // On prend en compte le décalage éventuel de la première construction par rapport à la seconde.
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
        points.push(new THREE.Vector3(decalage + 0.5, hauteurTexte, (LONGUEUR_TRAVEE / 2) + 6));
        decalage = tableauTravees[PREFIXE_TRAVEE + nbTravees].positionX + (LARGEUR_TRAVEE / 2);
        points.push(new THREE.Vector3(decalage - 0.5, hauteurTexte, (LONGUEUR_TRAVEE / 2) + 6));
        points.push(new THREE.Vector3(decalage - 0.5, hauteurTexte, (LONGUEUR_TRAVEE / 2) + 1));
        var line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), textMaterial);
        cotesGrpX.add(line);

        texte = "Construction 2 : " + nbTraveesConstruction2 * (LARGEUR_TRAVEE * 100) + ' mm';
        texteCotes = createText(texte);
        texteCotes.name = "CoteX_2>texte";
        texteCotes.rotation.x = -Math.PI / 2;
        xTexte = (tableauTravees[premiereTraveeConstruction2].positionX + tableauTravees[PREFIXE_TRAVEE + nbTravees].positionX) / 2;
        texteCotes.position.set(xTexte, hauteurTexte, (LONGUEUR_TRAVEE / 2) + 9);
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
    texteCotes.rotation.x = Math.PI / 2;
    texteCotes.rotation.y = Math.PI;
    texteCotes.rotation.z = -Math.PI / 2;
    texteCotes.position.set(decalage - 8, hauteurTexte, 0);
    texteCotes.name = "CoteY_1>texte";
    cotesGrpY.add(texteCotes);

    var points = [];
    points.push(new THREE.Vector3(decalage - 1, hauteurTexte, LONGUEUR_TRAVEE / 2 - 0.5));
    points.push(new THREE.Vector3(decalage - 6, hauteurTexte, LONGUEUR_TRAVEE / 2 - 0.5));
    points.push(new THREE.Vector3(decalage - 6, hauteurTexte, -LONGUEUR_TRAVEE / 2 + 0.5));
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
        texteCotes.position.set(decalage + 8, hauteurTexte, 0);
        texteCotes.name = "CoteY_2>texte";
        cotesGrpY.add(texteCotes);

        var points = [];
        points.push(new THREE.Vector3(decalage + 1, hauteurTexte, LONGUEUR_TRAVEE / 2 - 0.5));
        points.push(new THREE.Vector3(decalage + 6, hauteurTexte, LONGUEUR_TRAVEE / 2 - 0.5));
        points.push(new THREE.Vector3(decalage + 6, hauteurTexte, -LONGUEUR_TRAVEE / 2 + 0.5));
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


/********************************    Incrustation du nom des modules    ****************************************/

export function hideMainIncrustations() {
    scene.traverse(function (child) {
        if (child.name.includes(">Incrustation")) {
            child.visible = false;
        }
    });
}


export function showMainIncrustations() {
    scene.traverse(function (child) {

        if (child.name.includes(">Incrustation")) {
            var moduleLie = scene.getObjectByName(child.name.substr(0, child.name.lastIndexOf('>')));
            if (moduleLie && moduleLie.visible)
                child.visible = true;
            else {

                child.visible = false;

                // Cas particulier des modules PO, dont le mur plein est invisible (mais qui possède un bout de mur).
                if (child.userData.customVisibility) child.visible = true;
            }
        }
    });
}

export function hidePignonIncrustations() {
    scene.traverse(function (child) {
        if (child.name.includes(">PG>Incrustation") ||
            child.name.includes(">PD>Incrustation") ||
            child.name.includes(">plancher>Incrustation"))
            child.visible = false;
    });
}


export function showPignonIncrustations() {
    scene.traverse(function (child) {
        if (child.name.includes(">PG>Incrustation") ||
            child.name.includes(">PD>Incrustation") ||
            child.name.includes(">plancher>Incrustation"))
            child.visible = true;
    });
}

export function modifierIncrustation(travee, face, remplacant = false, visibility = false) {

    var groupe = scene.getObjectByName(travee);
    var nbEnfants = groupe.children.length;

    for (var i = nbEnfants - 1; i >= 0; i--) {
        if (groupe.children[i].name.includes(">" + face + ">Incrustation")) {

            var positionX = groupe.children[i].position.x;
            var positionY = groupe.children[i].position.y;
            var positionZ = groupe.children[i].position.z;

            if (remplacant) {
                var backupUserData = groupe.children[i].userData;
                groupe.remove(groupe.children[i]);

                if (remplacant.indexOf('_') != -1) remplacant = remplacant.slice(0, remplacant.indexOf('_'));
                var nouvelleIncrustation = createText(remplacant, taillePoliceIncrustations);

                nouvelleIncrustation.rotation.x = -Math.PI / 2;
                nouvelleIncrustation.position.set(positionX, positionY, positionZ);
                nouvelleIncrustation.name = travee + ">" + face + ">Incrustation";
                nouvelleIncrustation.visible = visibility;
                nouvelleIncrustation.userData = backupUserData;
                groupe.add(nouvelleIncrustation);
            } else
                groupe.children[i].visible = false;

            return;
        }
    }
}


export function redimensionnerIncrustations() {

    var nouvelleTaille = calculerTaillePoliceOptimale();
    var posX, posY, posZ;
    var rotX, rotY, rotZ;

    var aTraiter = new Array();
    scene.traverse(function (child) {
        if (child.geometry && child.geometry.type == "TextGeometry")
            aTraiter.push(child.name);
    });

    aTraiter.forEach(function (item) {
        var child = scene.getObjectByName(item);
        var nomTravee = child.parent.name,
            travee;

        if (child.visible) {
            var nouveauTexte = createText(child.geometry.parameters.text, nouvelleTaille);
            posX = child.position.x;
            posY = child.position.y;
            posZ = child.position.z;
            rotX = child.rotation.x;
            rotY = child.rotation.y;
            rotZ = child.rotation.z;

            travee = scene.getObjectByName(nomTravee);
            travee.remove(child);

            nouveauTexte.name = item;
            nouveauTexte.position.set(posX, posY, posZ);
            nouveauTexte.rotation.set(rotX, rotY, rotZ);
            travee.add(nouveauTexte);
        }
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



/*****************************************************************************************************/


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

export function initObjetsSysteme() {
    tableauTravees = new Array();
    objetsModifiables = new Array;
    inventaire = new Array();
    initInventaire();
    facesSelectionnees = new Array();
    objetSelectionne = '';
}

function initInventaire() {
    inventaire["MPL"] = inventaire["MPE"] = inventaire["MPF"] = inventaire["MPEF"] = inventaire["MF1"] = inventaire["MF2"] = inventaire["MPG1"] = inventaire["MPG2"] = inventaire["MPI"] = 0;
    inventaire["MF1R"] = inventaire["MF2R"] = inventaire["MPER"] = 0;

    inventaire["CH1T"] = inventaire["CHTS"] = 0;

    inventaire["SOLP"] = inventaire["SOLE"] = inventaire["SOLT"] = 0;

    inventaire["PEXT"] = inventaire["PINT"] = 0;
}

function initCaracteristiquesOuvertures() {

    // Tableau fixe des produits
    PRODUITS['MU'] = new Array(); // ScoreVT, largeur, hauteur, epaisseur, distance du sol
    PRODUITS['MU']['VT'] = 3;
    PRODUITS['MU']['largeur'] = PRODUITS['MU']['hauteur'] = PRODUITS['MU']['elevation'] = 0;
    PRODUITS['MU']['interieur'] = PRODUITS['MU']['exterieur'] = true;
    PRODUITS['MU']['epaisseur'] = 2;
    PRODUITS['MU']['codeModule'] = 'MPL';
    PRODUITS['MU']['categorie'] = 'Mur';
    PRODUITS['MU']['libelleModule'] = 'Mur plein';
    PRODUITS['MU']['coutFourchetteBasse'] = 50;
    PRODUITS['MU']['coutFourchetteHaute'] = 100;

    PRODUITS['PE'] = new Array();
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
    PRODUITS['PE']['coutFourchetteBasse'] = 0;
    PRODUITS['PE']['coutFourchetteHaute'] = 0;

    PRODUITS['PER'] = new Array();
    PRODUITS['PER']['VT'] = 3;
    PRODUITS['PER']['largeur'] = 9;
    PRODUITS['PER']['hauteur'] = 21.5;
    PRODUITS['PER']['epaisseur'] = 3;
    PRODUITS['PER']['elevation'] = 0.3;
    PRODUITS['PER']['interieur'] = false;
    PRODUITS['PER']['exterieur'] = true;
    PRODUITS['PER']['decalageX'] = 0.1;
    PRODUITS['PER']['codeModule'] = 'MPER';
    PRODUITS['PER']['categorie'] = "Porte d'entrée";
    PRODUITS['PER']['libelleModule'] = 'Porte entrée 90x215 renforcée';
    PRODUITS['PER']['coutFourchetteBasse'] = 0;
    PRODUITS['PER']['coutFourchetteHaute'] = 0;

    PRODUITS['F1d'] = new Array();
    PRODUITS['F1d']['VT'] = 2;
    PRODUITS['F1d']['largeur'] = 4.5;
    PRODUITS['F1d']['hauteur'] = 6.5;
    PRODUITS['F1d']['epaisseur'] = 3;
    PRODUITS['F1d']['elevation'] = 14.8;
    PRODUITS['F1d']['interieur'] = false;
    PRODUITS['F1d']['exterieur'] = true;
    PRODUITS['F1d']['decalageX'] = 8.8;
    PRODUITS['F1d']['codeModule'] = 'MF1';
    PRODUITS['F1d']['categorie'] = 'Fenêtre';
    PRODUITS['F1d']['libelleModule'] = 'Fenêtre 45x65';
    PRODUITS['F1d']['coutFourchetteBasse'] = 0;
    PRODUITS['F1d']['coutFourchetteHaute'] = 0;

    PRODUITS['F1dR'] = new Array();
    PRODUITS['F1dR']['VT'] = 3;
    PRODUITS['F1dR']['largeur'] = 4.5;
    PRODUITS['F1dR']['hauteur'] = 6.5;
    PRODUITS['F1dR']['epaisseur'] = 3;
    PRODUITS['F1dR']['elevation'] = 14.8;
    PRODUITS['F1dR']['interieur'] = false;
    PRODUITS['F1dR']['exterieur'] = true;
    PRODUITS['F1dR']['decalageX'] = 8.8;
    PRODUITS['F1dR']['codeModule'] = 'MF1R';
    PRODUITS['F1dR']['categorie'] = 'Fenêtre';
    PRODUITS['F1dR']['libelleModule'] = 'Fenêtre 45x65 renforcée';
    PRODUITS['F1dR']['coutFourchetteBasse'] = 0;
    PRODUITS['F1dR']['coutFourchetteHaute'] = 0;

    PRODUITS['F1g'] = new Array();
    PRODUITS['F1g']['VT'] = 2;
    PRODUITS['F1g']['largeur'] = 4.5;
    PRODUITS['F1g']['hauteur'] = 6.5;
    PRODUITS['F1g']['epaisseur'] = 3;
    PRODUITS['F1g']['elevation'] = 14.8;
    PRODUITS['F1g']['interieur'] = false;
    PRODUITS['F1g']['exterieur'] = true;
    PRODUITS['F1g']['decalageX'] = -8.8;
    PRODUITS['F1g']['codeModule'] = 'MF1';
    PRODUITS['F1g']['categorie'] = 'Fenêtre';
    PRODUITS['F1g']['libelleModule'] = 'Fenêtre 45x65';
    PRODUITS['F1g']['coutFourchetteBasse'] = 0;
    PRODUITS['F1g']['coutFourchetteHaute'] = 0;

    PRODUITS['F1gR'] = new Array();
    PRODUITS['F1gR']['VT'] = 3;
    PRODUITS['F1gR']['largeur'] = 4.5;
    PRODUITS['F1gR']['hauteur'] = 6.5;
    PRODUITS['F1gR']['epaisseur'] = 3;
    PRODUITS['F1gR']['elevation'] = 14.8;
    PRODUITS['F1gR']['interieur'] = false;
    PRODUITS['F1gR']['exterieur'] = true;
    PRODUITS['F1gR']['decalageX'] = -8.8;
    PRODUITS['F1gR']['codeModule'] = 'MF1R';
    PRODUITS['F1gR']['categorie'] = 'Fenêtre';
    PRODUITS['F1gR']['libelleModule'] = 'Fenêtre 45x65 renforcée';
    PRODUITS['F1gR']['coutFourchetteBasse'] = 0;
    PRODUITS['F1gR']['coutFourchetteHaute'] = 0;

    PRODUITS['F2'] = new Array();
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
    PRODUITS['F2']['coutFourchetteBasse'] = 0;
    PRODUITS['F2']['coutFourchetteHaute'] = 0;

    PRODUITS['F2R'] = new Array();
    PRODUITS['F2R']['VT'] = 3;
    PRODUITS['F2R']['largeur'] = 10.5;
    PRODUITS['F2R']['hauteur'] = 11.5;
    PRODUITS['F2R']['epaisseur'] = 3;
    PRODUITS['F2R']['elevation'] = 10;
    PRODUITS['F2R']['interieur'] = false;
    PRODUITS['F2R']['exterieur'] = true;
    PRODUITS['F2R']['decalageX'] = -0.5;
    PRODUITS['F2R']['codeModule'] = 'MF2R';
    PRODUITS['F2R']['categorie'] = 'Fenêtre';
    PRODUITS['F2R']['libelleModule'] = 'Fenêtre 105x115 renforcée';
    PRODUITS['F2R']['coutFourchetteBasse'] = 0;
    PRODUITS['F2R']['coutFourchetteHaute'] = 0;

    PRODUITS['PF'] = new Array();
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
    PRODUITS['PF']['coutFourchetteBasse'] = 0;
    PRODUITS['PF']['coutFourchetteHaute'] = 0;

    PRODUITS['PG1'] = new Array();
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
    PRODUITS['PG1']['coutFourchetteBasse'] = 0;
    PRODUITS['PG1']['coutFourchetteHaute'] = 0;

    PRODUITS['PG2'] = new Array();
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
    PRODUITS['PG2']['coutFourchetteBasse'] = 0;
    PRODUITS['PG2']['coutFourchetteHaute'] = 0;

    PRODUITS['PE+F1'] = new Array();
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
    PRODUITS['PE+F1']['coutFourchetteBasse'] = 0;
    PRODUITS['PE+F1']['coutFourchetteHaute'] = 0;

    PRODUITS['PO'] = new Array();
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
    PRODUITS['PO']['coutFourchetteBasse'] = 0;
    PRODUITS['PO']['coutFourchetteHaute'] = 0;

    PRODUITS['PEXT'] = new Array();
    PRODUITS['PEXT']['codeModule'] = 'PEXT';
    PRODUITS['PEXT']['categorie'] = 'Pignon';
    PRODUITS['PEXT']['libelleModule'] = 'Pignon extérieur';
    PRODUITS['PEXT']['coutFourchetteBasse'] = 0;
    PRODUITS['PEXT']['coutFourchetteHaute'] = 0;

    PRODUITS['PINT'] = new Array();
    PRODUITS['PINT']['codeModule'] = 'PINT';
    PRODUITS['PINT']['categorie'] = 'Pignon';
    PRODUITS['PINT']['libelleModule'] = 'Pignon intérieur';
    PRODUITS['PINT']['coutFourchetteBasse'] = 0;
    PRODUITS['PINT']['coutFourchetteHaute'] = 0;

    PRODUITS['CH1T'] = new Array();
    PRODUITS['CH1T']['codeModule'] = 'CH1T';
    PRODUITS['CH1T']['categorie'] = 'Charpente';
    PRODUITS['CH1T']['libelleModule'] = 'Charpente principale';
    PRODUITS['CH1T']['coutFourchetteBasse'] = 0;
    PRODUITS['CH1T']['coutFourchetteHaute'] = 0;

    PRODUITS['CHTS'] = new Array();
    PRODUITS['CHTS']['codeModule'] = 'CHTS';
    PRODUITS['CHTS']['categorie'] = 'Charpente';
    PRODUITS['CHTS']['libelleModule'] = 'Charpente complémentaire';
    PRODUITS['CHTS']['coutFourchetteBasse'] = 0;
    PRODUITS['CHTS']['coutFourchetteHaute'] = 0;

    PRODUITS['SOLP'] = new Array();
    PRODUITS['SOLP']['codeModule'] = 'SOLP';
    PRODUITS['SOLP']['categorie'] = 'Plancher';
    PRODUITS['SOLP']['libelleModule'] = 'Solivage plein';
    PRODUITS['SOLP']['coutFourchetteBasse'] = 0;
    PRODUITS['SOLP']['coutFourchetteHaute'] = 0;

    PRODUITS['SOLE'] = new Array();
    PRODUITS['SOLE']['codeModule'] = 'SOLE';
    PRODUITS['SOLE']['categorie'] = 'Plancher';
    PRODUITS['SOLE']['libelleModule'] = 'Solivage escalier';
    PRODUITS['SOLE']['coutFourchetteBasse'] = 0;
    PRODUITS['SOLE']['coutFourchetteHaute'] = 0;

    PRODUITS['SOLT'] = new Array();
    PRODUITS['SOLT']['codeModule'] = 'SOLT';
    PRODUITS['SOLT']['categorie'] = 'Plancher';
    PRODUITS['SOLT']['libelleModule'] = 'Solivage trappe';
    PRODUITS['SOLT']['coutFourchetteBasse'] = 0;
    PRODUITS['SOLT']['coutFourchetteHaute'] = 0;

    PRODUITS['ACC1'] = new Array();
    PRODUITS['ACC1']['codeModule'] = 'ACC1';
    PRODUITS['ACC1']['categorie'] = 'Accessoires';
    PRODUITS['ACC1']['libelleModule'] = 'Accessoires 1 travée';
    PRODUITS['ACC1']['coutFourchetteBasse'] = 0;
    PRODUITS['ACC1']['coutFourchetteHaute'] = 0;

    PRODUITS['ACC2'] = new Array();
    PRODUITS['ACC2']['codeModule'] = 'ACC2';
    PRODUITS['ACC2']['categorie'] = 'Accessoires';
    PRODUITS['ACC2']['libelleModule'] = 'Accessoires 2 travées';
    PRODUITS['ACC2']['coutFourchetteBasse'] = 0;
    PRODUITS['ACC2']['coutFourchetteHaute'] = 0;

    PRODUITS['ACC3'] = new Array();
    PRODUITS['ACC3']['codeModule'] = 'ACC3';
    PRODUITS['ACC3']['categorie'] = 'Accessoires';
    PRODUITS['ACC3']['libelleModule'] = 'Accessoires 3 travées';
    PRODUITS['ACC3']['coutFourchetteBasse'] = 0;
    PRODUITS['ACC3']['coutFourchetteHaute'] = 0;

    PRODUITS['ACC4'] = new Array();
    PRODUITS['ACC4']['codeModule'] = 'ACC4';
    PRODUITS['ACC4']['categorie'] = 'Accessoires';
    PRODUITS['ACC4']['libelleModule'] = 'Accessoires 4 travées';
    PRODUITS['ACC4']['coutFourchetteBasse'] = 0;
    PRODUITS['ACC4']['coutFourchetteHaute'] = 0;
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


/******************   Fonctions métier   *****************/


export function verifierControlesMetier(solivageSimule = null, constructionSimulee = null) {

    var controlesOK = true;
    var nbSolivageSimule = 0;

    if (solivageSimule !== null && (solivageSimule.includes('SOLE') || solivageSimule.includes('SOLT')))
        nbSolivageSimule++;

    // Tout projet doit comporter au moins une ouverture par construction
    if ((inventaire["SOLE"] + inventaire["SOLT"] + nbSolivageSimule) < nbConstructions) {
        controlesOK = false;
        alerte('Il faut au moins une ouverture de plancher pour <u>chacune</u> de vos constructions.')

        if ($("span:contains('afficherToit')").parent().find("input[type='checkbox']").prop('checked'))
            $("span:contains('afficherToit')").click();
        if (!$("span:contains('afficherPlancher')").parent().find("input[type='checkbox']").prop('checked'))
            $("span:contains('afficherPlancher')").click();

    } else {
        var SOLEConstruction1 = 0,
            SOLEConstruction2 = 0,
            SOLTConstruction1 = 0,
            SOLTConstruction2 = 0;

        // Il faut vérifier le bon nombre de trappes par construction
        for (var travee in tableauTravees) {
            if (tableauTravees[travee].numConstruction == 1) {
                if (tableauTravees[travee].typeSolivage.includes("SOLE"))
                    SOLEConstruction1++;
                if (tableauTravees[travee].typeSolivage.includes("SOLT"))
                    SOLTConstruction1++;
            }
            if (tableauTravees[travee].numConstruction == 2) {
                if (tableauTravees[travee].typeSolivage.includes("SOLE"))
                    SOLEConstruction2++;
                if (tableauTravees[travee].typeSolivage.includes("SOLT"))
                    SOLTConstruction2++;
            }
        }

        /* Mode simulation */
        if ((null !== solivageSimule) && (null !== constructionSimulee)) {
            switch (constructionSimulee) {
                case 1:
                    if (solivageSimule.includes("SOLE")) SOLEConstruction1++;
                    if (solivageSimule.includes("SOLT")) SOLTConstruction1++;
                    break;
                case 2:
                    if (solivageSimule.includes("SOLE")) SOLEConstruction2++;
                    if (solivageSimule.includes("SOLT")) SOLTConstruction2++;
                    break;
            }
        }

        if (SOLEConstruction1 > 1 || SOLTConstruction1 > 1 || SOLEConstruction2 > 1 || SOLTConstruction2 > 1) {
            controlesOK = false;
            var message;
            if (SOLEConstruction1 > 1)
                message = "Plusieurs trémies d\'escalier sur la construction n°1 :";
            if (SOLTConstruction1 > 1)
                message = "Plusieurs trappes sur la construction n°1 :";
            if (SOLEConstruction2 > 1)
                message = "Plusieurs trémies d\'escalier sur la construction n°2 :";
            if (SOLTConstruction2 > 1)
                message = "Plusieurs trappes sur la construction n°2 :";

            message += "<br>une seule ouverture <u>de chaque type</u> par construction autorisée.";

            if ((null !== solivageSimule) && (null !== constructionSimulee)) return false;
            else alerte(message);
        }
    }

    return controlesOK;
}


export function restaurerPrefsUtilisateur(numTravee, travee) {

    // A la création d'une travée, on reprend les préférences utilisateur (affichage toit, etc.)

    if (!$("span:contains('afficherToit')").parent().find("input[type='checkbox']").prop('checked')) {
        var leToit = scene.getObjectByName(PREFIXE_TRAVEE + numTravee + '>Toit');
        for (var i = 0; i < leToit.children.length; i++) {
            if (leToit.children[i].name.includes('toit')) {
                leToit.children[i].visible = false;
            }
        }
    }
    if (!$("span:contains('afficherPlancher')").parent().find("input[type='checkbox']").prop('checked'))
        travee.children[indiceRoof].visible = false;

}



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


export function rechercherFaceOpposee(nomTravee, face) {

    // Le but est de rechercher le module qui est éventuellement en jonction (alias le module qui fait face,
    // sur la travée mitoyenne) --> utile pour le doublonnage des modules.
    var decalageTraveeEnCours = tableauTravees[nomTravee].decalage;
    var numTraveeEnCours = parseInt(nomTravee.substr(nomTravee.indexOf(" ") + 1));

    if (face.includes("PG")) {
        var nomTraveeGauche = PREFIXE_TRAVEE + parseInt(numTraveeEnCours - 1);
        if (scene.getObjectByName(nomTraveeGauche)) {
            var decalageTraveeVoisine = tableauTravees[nomTraveeGauche].decalage;
            if (decalageTraveeVoisine === decalageTraveeEnCours) return null;

            if (face.includes("AV") && (decalageTraveeVoisine > decalageTraveeEnCours)) return [nomTraveeGauche, "PDAR"];
            if (face.includes("AR") && (decalageTraveeVoisine < decalageTraveeEnCours)) return [nomTraveeGauche, "PDAV"];
        }
    }

    if (face.includes("PD")) {
        var nomTraveeDroite = PREFIXE_TRAVEE + parseInt(numTraveeEnCours + 1);
        if (scene.getObjectByName(nomTraveeDroite)) {
            var decalageTraveeVoisine = tableauTravees[nomTraveeDroite].decalage;
            if (decalageTraveeVoisine === decalageTraveeEnCours) return null;

            if (face.includes("AV") && (decalageTraveeVoisine > decalageTraveeEnCours)) return [nomTraveeDroite, "PGAR"];
            if (face.includes("AR") && (decalageTraveeVoisine < decalageTraveeEnCours)) return [nomTraveeDroite, "PGAV"];
        }
    }

    return null;
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

    // Cas particulier des modules renforcés (MPG2, MF2R, ...) : on ne les propose qu'en façade, et uniquement pour les constructions à 1 (pour tous) ou 2 travées (uniquement pour MPG2).
    if (typesOuverturesAutorisees.indexOf("PG2") > -1 ||
        typesOuverturesAutorisees.indexOf("PER") > -1 ||
        typesOuverturesAutorisees.indexOf("F1gR") > -1 ||
        typesOuverturesAutorisees.indexOf("F1dR") > -1 ||
        typesOuverturesAutorisees.indexOf("F2R") > -1) {
        var aSupprimer = [];
        if (nomFace != "AV" && nomFace != "AR")
            aSupprimer = ['PG2', 'F1dR', 'F1gR', 'F2R', 'PER'];
        else {
            if ((typesOuverturesAutorisees.indexOf("PG2") > -1) && (traveesMemeConstruction.length > 2))
                aSupprimer.push('PG2');

            if ((traveesMemeConstruction.length > 1) && (
                    typesOuverturesAutorisees.indexOf("F1gR") > -1 ||
                    typesOuverturesAutorisees.indexOf("F1dR") > -1 ||
                    typesOuverturesAutorisees.indexOf("F2R") > -1 ||
                    typesOuverturesAutorisees.indexOf("PER") > -1
                )) {
                aSupprimer.push('F1dR');
                aSupprimer.push('F1gR');
                aSupprimer.push('F2R');
                aSupprimer.push('PER');
            }
        }

        if (aSupprimer.length > 0) {
            aSupprimer.forEach(function (item) {
                typesOuverturesAutorisees.splice(typesOuverturesAutorisees.indexOf(item), 1);
            });
            /*
            typesOuverturesAutorisees.splice(typesOuverturesAutorisees.indexOf('PG2'), 1);
            typesOuverturesAutorisees.splice(typesOuverturesAutorisees.indexOf('F1gR'), 1);
            typesOuverturesAutorisees.splice(typesOuverturesAutorisees.indexOf('F1dR'), 1);
            typesOuverturesAutorisees.splice(typesOuverturesAutorisees.indexOf('F2R'), 1);
            typesOuverturesAutorisees.splice(typesOuverturesAutorisees.indexOf('PER'), 1);
            */
        }
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


function positionnerPopups() {

    var largeurViewport = window.innerWidth;
    var hauteurViewport = window.innerHeight;

    $("#popup-plancher").css({
        left: (largeurViewport / 2) - ($("#popup-plancher").width() / 2) + 'px',
        top: (hauteurViewport / 2) - ($("#popup-plancher").height() / 2) + 'px'
    });

    $("#popup-pignon").css({
        left: (largeurViewport / 2) - ($("#popup-pignon").width() / 2) + 'px',
        top: (hauteurViewport / 2) - ($("#popup-pignon").height() / 2) + 'px'
    });

    $("#popup-export").css({
        left: (largeurViewport / 2) - ($("#popup-export").width() / 2) + 'px',
        top: (hauteurViewport / 2) - ($("#popup-export").height() / 2) + 'px'
    });

    $("#popup-attente").css({
        left: (largeurViewport / 2) - ($("#popup-attente").width() / 2) + 'px',
        top: (hauteurViewport / 2) - ($("#popup-attente").height() / 2) + 'px'
    });

    $("#popup-ouverture-in").css({
        left: (largeurViewport / 2) - ($("#popup-ouverture-in").width() / 2) + 'px',
        top: (hauteurViewport / 2) - ($("#popup-ouverture-in").height() / 2) + 'px'
    });

    $("#popup-ouverture-out").css({
        left: (largeurViewport / 2) - ($("#popup-ouverture-out").width() / 2) + 'px',
        top: (hauteurViewport / 2) - ($("#popup-ouverture-out").height() / 2) + 'px'
    });

    $("#popup-decalage").css({
        left: (largeurViewport / 2) - ($("#popup-decalage").width() / 2) + 'px',
        top: (hauteurViewport / 2) - ($("#popup-decalage").height() / 2) + 'px'
    });

}



export function simulerCalculConstructions(tableauDecalages) {
    return recalculerConstructions(tableauDecalages);
}

export function recalculerConstructions(tableauDecalages = null) {

    if (nbTravees > 0) {

        // Mode "simulation"
        if (tableauDecalages != null) {
            var nbTraveesConstCourante = 1;
            var nbConstructionsTmp = 1;
            var nbTraveesC1 = 1,
                nbTraveesC2 = 0;

            for (var i = 1; i < tableauDecalages.length; i++) {
                if (tableauDecalages[i] != tableauDecalages[i - 1]) {
                    nbConstructionsTmp++;
                    nbTraveesConstCourante = 1;
                } else
                    nbTraveesConstCourante++;


                if (nbConstructionsTmp == 1)
                    if (nbTraveesConstCourante > nbTraveesC1) nbTraveesC1 = nbTraveesConstCourante;

                if (nbConstructionsTmp == 2)
                    if (nbTraveesConstCourante > nbTraveesC2) nbTraveesC2 = nbTraveesConstCourante;

            }
            return [nbConstructionsTmp, nbTraveesC1, nbTraveesC2];
        } else {

            // On recalcule tout en partant de la première travée, qui sera la construction 1.
            var traveesParConstruction = 1;
            nbConstructionsTmp = 1;
            tableauTravees[PREFIXE_TRAVEE + 1]['numConstruction'] = 1;
            tableauTravees[PREFIXE_TRAVEE + 1]['rangDansConstruction'] = 1;

            for (var i = 2; i <= nbTravees; i++) {

                if (tableauTravees[PREFIXE_TRAVEE + i]['decalage'] != tableauTravees[PREFIXE_TRAVEE + parseInt(i - 1)]['decalage']) {
                    // Nouvelle construction
                    nbConstructionsTmp++;
                    traveesParConstruction = 1;
                    tableauTravees[PREFIXE_TRAVEE + i]['numConstruction'] = nbConstructionsTmp;
                    tableauTravees[PREFIXE_TRAVEE + i]['rangDansConstruction'] = 1;
                } else {

                    // Même décalage que la travée de gauche
                    traveesParConstruction++;
                    if (traveesParConstruction > NB_TRAVEES_MAXI) {
                        nbConstructionsTmp++;
                        traveesParConstruction = 1;
                        tableauTravees[PREFIXE_TRAVEE + i]['numConstruction'] = nbConstructionsTmp;
                        tableauTravees[PREFIXE_TRAVEE + i]['rangDansConstruction'] = 1;
                    } else {
                        tableauTravees[PREFIXE_TRAVEE + i]['numConstruction'] = tableauTravees[PREFIXE_TRAVEE + parseInt(i - 1)]['numConstruction'];
                        tableauTravees[PREFIXE_TRAVEE + i]['rangDansConstruction'] = traveesParConstruction;
                    }
                }
            }
            nbConstructions = nbConstructionsTmp;
        }
    }
}



/*********************************************************************************************************************************/

// Ca, c'est utilisé pour pouvoir télécharger localement des fichiers.
var link = document.createElement('a');
link.style.display = 'none';
document.body.appendChild(link);



function generate(l = 8) {
    /* c : chaîne de caractères alphanumérique */
    var c = 'abcdefghijknopqrstuvwxyzACDEFGHJKLMNPQRSTUVWXYZ12345679',
        n = c.length,
        /* p : chaîne de caractères spéciaux */
        p = '___',
        o = p.length,
        r = '',
        n = c.length,
        /* s : determine la position du caractère spécial dans le mdp */
        s = Math.floor(Math.random() * (p.length - 1));

    for (var i = 0; i < l; ++i) {
        if (s == i) {
            /* on insère à la position donnée un caractère spécial aléatoire */
            r += p.charAt(Math.floor(Math.random() * o));
        } else {
            /* on insère un caractère alphanumérique aléatoire */
            r += c.charAt(Math.floor(Math.random() * n));
        }
    }
    return r;
}



function uploadBlob(blob, filename) {

    var reader = new FileReader();
    reader.onload = function (event) {
        var fd = {};
        fd["fname"] = filename;
        fd["data"] = event.target.result;
        $.ajax({
            type: 'POST',
            url: URL_DEVIS,
            data: fd,
            dataType: 'text'
        }).done(function (data) {
            console.log(data);
        });
    };
    reader.readAsDataURL(blob);
}

function save(blob, filename, copieLocale = false) {

    if (copieLocale) {
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
    }
    uploadBlob(blob, filename);
}

function saveString(text, filename, copieLocale = false) {
    save(new Blob([text], {
        type: 'text/plain'
    }), filename, copieLocale);
}

/*
function saveArrayBuffer(buffer, filename) {
    save(new Blob([buffer], {
        type: 'application/octet-stream'
    }), filename);
}
*/

export function updateClipboard(newClip) {
    navigator.clipboard.writeText(newClip).then(function () {
        /* clipboard successfully set */
    }, function () {
        /* clipboard write failed */
        alerte("Impossible d'écrire dans votre presse-papiers.<br>Veuillez bien noter la référence suivante : " + newClip);

    });
}


export function exportProjet() {

    var copieLocale = false;
    var reference = generate(12);
    var exportJson = '{ "projet" : [';

    for (var travee in tableauTravees) {
        var traveeEnCours = '';
        traveeEnCours += '{ "nom": "' + tableauTravees[travee].nom + '",';
        traveeEnCours += '  "solivage": "' + tableauTravees[travee].typeSolivage + '",';
        if (tableauTravees[travee].typePINT) {
            traveeEnCours += '  "pint": "' + tableauTravees[travee].typePINT + '",';
        }
        traveeEnCours += '  "decalageZ": ' + tableauTravees[travee].decalage + ',';
        traveeEnCours += '  "modules": [';

        var laTravee = scene.getObjectByName(tableauTravees[travee].nom);

        laTravee.children.forEach(function (child) {
            if (child.name.includes(">Ouverture")) {
                if (child.name.lastIndexOf('>') < child.name.indexOf("Ouverture")) {
                    var leModule = child.name.substr(child.name.indexOf("Ouverture ") + "Ouverture ".length);
                    var laFace = child.name.substring(child.name.indexOf(">") + 1, child.name.lastIndexOf(">"));
                    traveeEnCours += '{ "face": "' + laFace + '",';
                    traveeEnCours += '"module": "' + leModule + '" }';
                    traveeEnCours += ',';
                }
            }
        });
        // Il faut virer la dernière virgule
        if (traveeEnCours.charAt(traveeEnCours.length - 1) == ',') traveeEnCours = traveeEnCours.slice(0, traveeEnCours.length - 1);
        traveeEnCours += '] },';

        exportJson += traveeEnCours;
    };
    exportJson = exportJson.slice(0, exportJson.length - 1);
    exportJson += ']}';

    saveString(exportJson, reference + '.json', copieLocale);

    return reference;
}


export function importProjet(nomFichier) {

    $.ajax({
        url: URL_DEVIS + "/devis_clients/" + nomFichier + ".json",
        async: false,
        type: 'GET',
        dataType: 'json',
        success: function (data) {
            // Première passe pour créer (et décaler éventuellement) les travées...
            var decalagePrecedent = 0;
            for (var i = 0; i < data.projet.length; i++) {
                var nomTravee = data.projet[i].nom;

                var travee = creerTravee();
                if (travee) traitementCreationTravee(travee);
                if (i == 0) nbConstructions = nbTravees = 1;

                if (data.projet[i].decalageZ != decalagePrecedent) {
                    if (data.projet[i].decalageZ < 0) decalerTravee(nomTravee, 'back', false);
                    if (data.projet[i].decalageZ > 0) decalerTravee(nomTravee, 'front', false);
                    decalagePrecedent = data.projet[i].decalageZ;
                }

                selectionnerSolivage(nomTravee, data.projet[i].solivage);

                if (data.projet[i].pint) {
                    var pignon = scene.getObjectByName(nomTravee + ">PINT");
                    if (pignon) {
                        switch (data.projet[i].pint) {
                            case "gauche":
                                pignon.material = PINT_Gauche_Material;
                                tableauTravees[nomTravee].typePINT = "gauche";
                                break;
                            case "droite":
                                pignon.material = PINT_Droite_Material;
                                tableauTravees[nomTravee].typePINT = "droite";
                                break;
                        }
                    }
                }
            }

            // ...puis on rajoute les ouvertures.
            for (var i = 0; i < data.projet.length; i++) {

                data.projet[i].modules.forEach(function (module) {

                    var nomTravee = data.projet[i].nom;

                    if (module.module === "PE+F1") {
                        var combo = creerComboOuvertures(nomTravee, module.face);
                        traitementCreationOuverture(nomTravee, module.face, combo);
                    } else {
                        var nouvelleOuverture = creerOuverture(nomTravee, module.face, module.module);
                        traitementCreationOuverture(nomTravee, module.face, nouvelleOuverture);
                    }

                });
            }

            return true;
        },
        error: function (e) {
            alert("La référence de projet que vous avez saisie n'existe pas. Veuillez saisir une référence valide.");

            nbConstructions = nbTravees = nbOuvertures = 0;
            initObjetsSysteme();

            creerProjetBasique();
        }
    });

}


/**********************************************************************************************************/

function creerProjetBasique() {

    // Création d'un projet de base
    var travee = creerTravee();
    traitementCreationTravee(travee);
    nbConstructions = nbTravees = 1;

    var nouvelleOuverture = creerOuverture("Travee 1", "AV", "PG2");
    traitementCreationOuverture("Travee 1", "AV", nouvelleOuverture);
    selectionnerSolivage("Travee 1", "SOLT_bc");
}



$(document).ready(function () {

    $(".popup-ouverture").hide();
    $("#div-menu-contextuel").hide();
    $("#vue-aerienne").hide();
    $("#popup-attente").hide();
    $("#popup-export").hide();
    $("#overlay").hide();
    $("#transparent-overlay").hide();
    $('#popup-decalage').hide();
    $(".div-aide").addClass("affiche");
    positionnerPopups();

    $("#formulaire").hide();

    // ATTENTION : bien respecter l'ordre d'appel des méthodes suivantes !!
    initCaracteristiquesOuvertures();
    initMatricesScoreVT();
    initObjetsSysteme();
    initInventaire();

    init();
    displayGui();
    window.addEventListener('resize', onWindowResize, false);
    document.addEventListener('dblclick', onMouseDoubleClick);
    document.addEventListener('click', onMouseClick);
    //    document.addEventListener('mousemove', onMouseMove, false);
    document.body.addEventListener('keydown', keyPressed);

    creerProjetBasique();

    animate();

});
