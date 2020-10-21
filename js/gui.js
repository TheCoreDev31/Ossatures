import {
    creerTravee,
    creerOuverture,
    supprimerToutesOuvertures,
    traitementCreationTravee,
    traitementCreationOuverture,
    selectionnerSolivage
} from "./objects.js"

import {
    createText,
    glassMaterial,
    doorMaterial,
    garageDoorMaterial,
    pignonMaterial,
    wallMaterial,
    roofMaterial,
    MPL_Material,
    MPE_Material,
    MF1_Material,
    MF2_Material,
    MPEF_Material,
    MPF_Material,
    MPI_Material,
    MPG1_Material,
    MPG2_Material,
    PEXT_Material,
    CH1T_Material,
    COLOR_ARRAY,
    blankMaterial,
    groundMaterial
}
from "./materials.js"

import {
    URL_JSREPORT,
    info,
    alerte,
    log,
    retirerObjetModifiable,
    extraireFace,
    extraireNomTravee,
    verifierContraintes,
    showMainIncrustations,
    hideMainIncrustations,
    showPignonIncrustations,
    hidePignonIncrustations,
    incrusterCotes,
    animate,
    recalculerConstructions,
    calculerTaillePoliceOptimale,
    redimensionnerIncrustations,
    changerCouleurTextes,
    verifierControlesMetier,
    modifierIncrustation,
    restaurerPrefsUtilisateur,
    importProjet,
    exportProjet,
    initObjetsSysteme
} from "./main.js"

import {
    camera,
    cameraOrtho,
    canvas,
    renderer,
    aspectRatio,
    initPositionCamera
} from "./environment.js"


export function unSelect() {

    /* On masque le menu déroulant...
       on déselectionne tous les objets à l'IHM,
       puis on vide les variables  */

    $("#div-menu-contextuel").hide();

    if (objetSelectionne) {
        var objetTouche = scene.getObjectByName(objetSelectionne);

        for (var i = 0; i < facesSelectionnees.length; i++) {

            // Suivant l'objet touché...
            if (!objetTouche.parent.name.includes('>')) { // Un mur            
                objetTouche.geometry.faces[facesSelectionnees[i]].color.set(COLOR_ARRAY['blanc']);
            } else {

                if (objetTouche.name.includes('Portique'))
                    objetTouche.geometry.faces[facesSelectionnees[i]].color.set(COLOR_ARRAY['blanc']);

                if (objetTouche.name.includes('Vitre'))
                    objetTouche.material = glassMaterial;

                if (objetTouche.name.includes('Porte')) {
                    if (objetTouche.name.includes('PG'))
                        objetTouche.material = garageDoorMaterial;
                    else
                        objetTouche.material = doorMaterial;
                }

                if (objetTouche.name.includes('PINT')) { // Pignon intérieur
                    for (var k = 0; k < 12; k++) {
                        objetTouche.geometry.faces[k].color.set(COLOR_ARRAY['blanc']);
                    }
                }
            }
        }
        objetTouche.geometry.elementsNeedUpdate = true;
    }
    facesSelectionnees.length = 0;
    objetSelectionne = '';

    if ($("#message-info").prop("class") == "normal")
        info(null);
}



export function changePointOfView(direction, modePDF = false) {

    // On calcule les contours de notre construction
    var left = tableauTravees['Travee 1'].positionX - (LARGEUR_TRAVEE / 2);
    var right = tableauTravees['Travee ' + nbTravees].positionX + (LARGEUR_TRAVEE / 2);
    var front = LONGUEUR_TRAVEE / 2;
    var back = -(LONGUEUR_TRAVEE / 2);

    var decalageGauche = tableauTravees['Travee 1'].decalage * (LONGUEUR_TRAVEE / 2);
    var decalageDroite = tableauTravees['Travee ' + nbTravees].decalage * (LONGUEUR_TRAVEE / 2);
    if (decalageGauche < 0 || decalageDroite < 0)
        back = -LONGUEUR_TRAVEE;

    if (decalageGauche > 0 || decalageDroite > 0)
        front = LONGUEUR_TRAVEE;

    if (modePDF)
        activeCamera = cameraOrtho;
    else
        activeCamera = camera;

    switch (direction) {
        case 'dessus':
            camera.position.set(0, 200, 0);
            camera.lookAt(scene.position);
            info("Vue de dessus");
            break;
        case 'avant':
            if (modePDF) {
                cameraOrtho.position.set(0, HAUTEUR_TRAVEE / 2, 80);
                cameraOrtho.lookAt(0, HAUTEUR_TRAVEE / 2, 0);

                cameraOrtho.left = tableauTravees['Travee 1'].positionX - 40;
                cameraOrtho.right = tableauTravees['Travee ' + nbTravees].positionX + 40;
                cameraOrtho.top = (((cameraOrtho.right - cameraOrtho.left) / aspectRatio) / 2) + 10;
                cameraOrtho.bottom = -(((cameraOrtho.right - cameraOrtho.left) / aspectRatio) / 2) + 10;
                cameraOrtho.far = 100;
                cameraOrtho.near = -100;
            } else {
                camera.position.set(0, 10, 100 + front + (Math.log(nbTravees) * 50));
                camera.lookAt(scene.position);
            }
            info("Vue avant");
            break;
        case 'arriere':
            if (modePDF) {
                cameraOrtho.position.set(0, HAUTEUR_TRAVEE / 2, -80);
                cameraOrtho.lookAt(0, HAUTEUR_TRAVEE / 2, 0);

                cameraOrtho.left = tableauTravees['Travee 1'].positionX - 40;
                cameraOrtho.right = tableauTravees['Travee ' + nbTravees].positionX + 40;
                cameraOrtho.top = (((cameraOrtho.right - cameraOrtho.left) / aspectRatio) / 2) + 10;
                cameraOrtho.bottom = -(((cameraOrtho.right - cameraOrtho.left) / aspectRatio) / 2) + 10;
                cameraOrtho.far = 100;
                cameraOrtho.near = -100;
            } else {
                camera.position.set(0, 10, -100 + back - (Math.log(nbTravees) * 50));
                camera.lookAt(scene.position);
            }
            info("Vue arrière");
            break;
        case 'gauche':
            if (modePDF) {
                var posLeft = tableauTravees['Travee 1'].positionX - (LARGEUR_TRAVEE / 2);
                cameraOrtho.position.set(posLeft - 50, HAUTEUR_TRAVEE / 2, (decalageGauche + decalageDroite) / 2);
                cameraOrtho.lookAt(0, HAUTEUR_TRAVEE / 2, (decalageGauche + decalageDroite) / 2);

                cameraOrtho.left = -80;
                cameraOrtho.right = 80;
                cameraOrtho.top = (((cameraOrtho.right - cameraOrtho.left) / aspectRatio) / 2) + 10;
                cameraOrtho.bottom = -(((cameraOrtho.right - cameraOrtho.left) / aspectRatio) / 2) + 10;
                cameraOrtho.near = tableauTravees['Travee 1'].positionX - 20;
                cameraOrtho.far = tableauTravees['Travee ' + nbTravees].positionX + 20;

                if (DEBUG) {
                    log("cameraOrtho.left=" + cameraOrtho.left + " / cameraOrtho.right=" + cameraOrtho.right + " / cameraOrtho.near=" + cameraOrtho.near + " / cameraOrtho.far=" + cameraOrtho.far);
                    log("decalageGauche=" + decalageGauche + " / decalageDroite=" + decalageDroite);
                    log("cameraPosition=");
                    log(cameraOrtho.position);
                }
            } else {
                var z;
                if (decalageDroite == 0)
                    z = -decalageGauche * 2;
                else
                    z = decalageDroite * 2;

                camera.position.set(-100 + left, 10, z);
                camera.lookAt(scene.position);
            }
            info("Vue de gauche");
            break;
        case 'droite':
            if (modePDF) {
                var posRight = tableauTravees['Travee ' + nbTravees].positionX + (LARGEUR_TRAVEE / 2);
                cameraOrtho.position.set(posRight + 50, HAUTEUR_TRAVEE / 2, (decalageGauche + decalageDroite) / 2);
                cameraOrtho.lookAt(0, HAUTEUR_TRAVEE / 2, (decalageGauche + decalageDroite) / 2);

                cameraOrtho.left = -80;
                cameraOrtho.right = 80;
                cameraOrtho.top = (((cameraOrtho.right - cameraOrtho.left) / aspectRatio) / 2) + 10;
                cameraOrtho.bottom = -(((cameraOrtho.right - cameraOrtho.left) / aspectRatio) / 2) + 10;
                cameraOrtho.near = tableauTravees['Travee 1'].positionX - 20;
                cameraOrtho.far = tableauTravees['Travee ' + nbTravees].positionX + 20;

                if (DEBUG) {
                    log("cameraOrtho.left=" + cameraOrtho.left + " / cameraOrtho.right=" + cameraOrtho.right + " / cameraOrtho.near=" + cameraOrtho.near + " / cameraOrtho.far=" + cameraOrtho.far);
                    log("decalageGauche=" + decalageGauche + " / decalageDroite=" + decalageDroite);
                    log("cameraPosition=");
                    log(cameraOrtho.position);
                }
            } else {
                var z;
                if (decalageGauche == 0)
                    z = -decalageDroite * 2;
                else
                    z = decalageGauche * 2;

                camera.position.set(100 + right, 10, z);
                camera.lookAt(0, 0, -z);
            }
            info("Vue de droite");
            break;
        case 'perspective':
            camera.position.set(60, 40, 160);
            camera.lookAt(scene.position);
            break;
    }
}


export function afficherVueAerienne(modePDF = false) {

    $("div:contains('Close Controls')").click();
    $("#changement-vue div#aerien").addClass('actif');

    // On masque toit et plancher (si pas déjà masqués)
    if ($("span:contains('afficherToit')").parent().find("input[type='checkbox']").prop('checked'))
        $("span:contains('afficherToit')").click();

    if ($("span:contains('afficherPlancher')").parent().find("input[type='checkbox']").prop('checked'))
        $("span:contains('afficherPlancher')").click();

    initPositionCamera(cameraOrtho);

    // On calcule les limites gauche, droite, haut et bas de la construction, afin de cadrer au mieux.
    var MARGE_GAUCHE = 20;
    var MARGE_DROITE = 50;
    var MARGE_HAUT = 5;
    var MARGE_BAS = 20;

    var gauche = tableauTravees['Travee 1'].positionX - (LARGEUR_TRAVEE / 2) - MARGE_GAUCHE; // Bord gauche de la construction + marge
    var droite = tableauTravees['Travee ' + nbTravees].positionX + (LARGEUR_TRAVEE / 2) + MARGE_DROITE; // Bord droit + marge
    var largeur = droite - gauche;
    var hauteurCalculee = largeur / aspectRatio;

    var maxTop = 0;
    var minBottom = 0;
    for (var laTravee in tableauTravees) {
        if (tableauTravees[laTravee].positionZ < maxTop)
            maxTop = tableauTravees[laTravee].positionZ;

        if (tableauTravees[laTravee].positionZ >= minBottom)
            minBottom = tableauTravees[laTravee].positionZ;
    }
    maxTop -= (LONGUEUR_TRAVEE / 2);
    maxTop = -maxTop + MARGE_HAUT;
    minBottom += (LONGUEUR_TRAVEE / 2);
    minBottom = -minBottom - MARGE_BAS;
    var hauteur = maxTop - minBottom;
    var largeurCalculee = hauteur * aspectRatio;

    if (hauteurCalculee >= hauteur) {
        cameraOrtho.left = gauche;
        cameraOrtho.right = droite;
        cameraOrtho.top = maxTop + ((hauteurCalculee - hauteur) / 2);
        cameraOrtho.bottom = minBottom - ((hauteurCalculee - hauteur) / 2);
    } else {
        cameraOrtho.top = maxTop;
        cameraOrtho.bottom = minBottom;
        cameraOrtho.left = gauche - ((largeurCalculee - largeur) / 2);
        cameraOrtho.right = droite + ((largeurCalculee - largeur) / 2);
    }


    if (DEBUG) {
        log("left/right : " + gauche + " / " + droite + " soit une largeur de " + largeur + " et une hauteur calculée de " + hauteurCalculee);
        log("top/bottom : " + maxTop + " / " + minBottom + " soit une hauteur de " + hauteur + " et une largeur calculée de " + largeurCalculee);
    }

    activeCamera = cameraOrtho;

    $("#changement-vue div#aerien").addClass('surligne');
    showMainIncrustations();
    hidePignonIncrustations();

    // On adapte la taille des incrustations au niveau de zoom : pour ça, pas d'autre choix
    // que de supprimer/recréer les incrustations.
    if (!modePDF)
        redimensionnerIncrustations();

    $("#legende").hide();
    $("#vue-aerienne").show();
    $("#transparent-overlay").show();
}

/*******************************    Gestion du menu contextuel    ***********************************************/

function addInfo(message) {
    var liText = "<li class=\"blank\">" + message + "</li>";

    $('.liste-deroulante').append(liText);
}

function addMenu(menuTitle, action, isActive = true) {

    var liText = liText = "<li data-action=\"" + action + "\"";

    if (action.match('moveFront')) liText += " class=\"moveFront";
    if (action.match('moveBack')) liText += " class=\"moveBack";
    if (action.match('add')) liText += " class=\"add";
    if (action.match('delete')) liText += " class=\"delete";
    if (action.match('choose')) liText += " class=\"choose";
    if (!isActive) liText += " disabled";
    liText += "\">" + menuTitle + "</li>";

    $('.liste-deroulante').append(liText);
}

function addSeparator() {
    var liText = "<hr>";
    $('.liste-deroulante').append(liText);
}


export function chooseFloorHole(traveeSelectionnee) {
    $('.popup-ouverture-image').each(function (i) {
        $(this).parent().removeClass();
        $(this).parent().addClass("normal");
    });

    $("#popup-plancher").css({
        left: (window.innerWidth / 2) - ($("#popup-plancher").width() / 2) + 'px',
        top: (window.innerHeight / 2) - ($("#popup-plancher").height() / 2) + 'px'
    });
    $("#popup-plancher").show();
    $("#traveeSelectionnee").val(traveeSelectionnee);
    $("#overlay").show();
}


export function displayPignonOpenings(traveeSelectionnee) {
    $("#popup-pignon").css({
        left: (window.innerWidth / 2) - ($("#popup-pignon").width() / 2) + 'px',
        top: (window.innerHeight / 2) - ($("#popup-pignon").height() / 2) + 'px'
    });

    // RAZ des figures
    $('.popup-ouverture-image').each(function (i) {
        $(this).parent().removeClass();
        $(this).parent().addClass("normal");
    });

    $("#popup-pignon").show();
    $("#traveeSelectionnee").val(traveeSelectionnee);
    $("#overlay").show();
}


export function displayOpenings(traveeSelectionnee, face) {

    // RAZ des figures
    $('.popup-ouverture-image').each(function (i) {
        $(this).parent().removeClass();
        $(this).parent().addClass("normal");
    });
    disableUnauthorizedOpenings(verifierContraintes(traveeSelectionnee));

    if (face == 'interieur') {
        $("#popup-ouverture-in").css({
            left: (window.innerWidth / 2) - ($("#popup-ouverture-in").width() / 2) + 'px',
            top: (window.innerHeight / 2) - ($("#popup-ouverture-in").height() / 2) + 'px'
        });
        $("#popup-ouverture-in").show();

    } else {

        $("#popup-ouverture-out").css({
            left: (window.innerWidth / 2) - ($("#popup-ouverture-out").width() / 2) + 'px',
            top: (window.innerHeight / 2) - ($("#popup-ouverture-out").height() / 2) + 'px'
        });
        $("#popup-ouverture-out").show();
    }
    $("#traveeSelectionnee").val(traveeSelectionnee);
    $("#overlay").show();
}

export function disableUnauthorizedOpenings(tableauOuverturesAutorisees) {

    $('.popup-ouverture-image').each(function (i) {

        if (!tableauOuverturesAutorisees.includes($(this).parent().attr('id'))) {
            $(this).parent().toggleClass("disabled");
        }
    });
}

export function displayContextualMenu(objet, x, y) {

    if (facesSelectionnees.length > 1) return;

    /*   -> ex : "Travee 1>AV"                       => décaler la travée + rajouter ouverture (si permis)
         -> ex : "Travee 1>PDAV"                     => seulement rajouter une ouverture
         -> ex : "Travee 1>AV>Ouverture F2>Vitre"    => seulement supprimer l'ouverture                */
    $('.liste-deroulante').empty();

    addInfo($("#message-info").html());
    addSeparator();
    if (objet.name.includes('Ouverture'))
        addMenu("Supprimer cette ouverture", 'deleteOuverture');
    else {
        if (objet.name.includes('>AV') || objet.name.includes('>AR')) {

            var decalageActuel = tableauTravees[objet.parent.name]['decalage'];
            if (decalageActuel < 0) {
                addMenu("Reculer cette travée", 'moveBackTravee', false);
                addMenu("Avancer cette travée", 'moveFrontTravee');
            } else {
                if (decalageActuel > 0) {
                    addMenu("Reculer cette travée", 'moveBackTravee');
                    addMenu("Avancer cette travée", 'moveFrontTravee', false);

                } else {
                    addMenu("Reculer cette travée", 'moveBackTravee');
                    addMenu("Avancer cette travée", 'moveFrontTravee');
                }
            }
            addSeparator();
        }
        if (objet.name.includes('plancher')) {
            addMenu("Choisir le solivage", 'chooseFloorHole');
        } else {

            if (objet.name.includes('PINT')) {
                addMenu("Choisir l'ouverture", 'addPignonOpening');
            } else {
                var nomFace = extraireFace(objet.name);
                // S'il existe déjà une ouverture sur ce module, on grise la possibilité d'en ajouter une autre.
                if (tableauTravees[extraireNomTravee(objet.name)]['nb_ouvertures_' + nomFace] > 0)
                    addMenu("Créer une ouverture", 'addOpening', false);
                else
                    addMenu("Créer une ouverture", 'addOpening');
            }
        }
    }
    addSeparator();
    addMenu("Annuler la sélection", 'unselect');


    // Suivant la position du curseur, on place le menu à gauche ou à droite de cette dernière.
    var left = (x >= (window.innerWidth / 2)) ? (x + 30) + 'px' : (x - $("#div-menu-contextuel").width() - 30) + 'px';
    $("#div-menu-contextuel").css({
        left: left,
        top: y - ($("#div-menu-contextuel").height() / 2) + 'px'
    });
    $("#div-menu-contextuel").show();
}



function saveAsImage() {
    var imgData, imgNode;
    var strDownloadMime = "image/octet-stream";

    try {
        var strMime = "image/jpeg";
        imgData = renderer.domElement.toDataURL(strMime);

        return imgData.replace(strMime, strDownloadMime);
    } catch (e) {
        console.log(e);
        return;
    }
}

var saveFile = function (strData, filename) {
    var link = document.createElement('a');
    if (typeof link.download === 'string') {
        document.body.appendChild(link); //Firefox requires the link to be in the body
        link.download = filename;
        link.href = strData;
        link.click();
        document.body.removeChild(link); //remove the link when done
    } else {
        location.replace(uri);
    }
}


export function displayGui() {

    var controller = new function () {
        this.afficherToit = true;
        this.afficherPlancher = true;
        this.afficherCotes = true;
        this.ossatureBois = false;


        this.exporterCeProjet = function () {

            scene.updateMatrixWorld();
            var reference = exportProjet();

            var texteFinal = $("#popup-export .texte").html().replace('%s', reference);
            $("#popup-export span.texte").html(texteFinal);
            $("#popup-export").css({
                left: (window.innerWidth / 2) - ($("#popup-attente").width() / 2) + 'px',
                top: (window.innerHeight / 2) - ($("#popup-attente").height() / 2) + 'px'
            });
            $("#popup-export").show();
            $("#overlay").show();
        };


        this.importerUnProjet = function () {

            var refDevis = prompt("Veuillez saisir la référence de votre projet :", "test");
            if (refDevis === null) return;

            for (var i = 0; i < nbTravees; i++) {
                scene.remove(scene.getObjectByName(PREFIXE_TRAVEE + parseInt(i + 1)));
            }
            nbConstructions = nbTravees = nbOuvertures = 0;

            // Il faut vider les tableaux utilisés par le système.
            initObjetsSysteme();

            importProjet(refDevis);
            incrusterCotes();
            scene.updateMatrixWorld();
        };


        this.genererDevis = function () {

            if (!verifierControlesMetier()) return;

            var modePDF = true;
            var screenshot1, screenshot2, screenshot3, screenshot4, screenshot5, screenshot6, screenshot7, screenshot8, screenshot9;

            var coordonneesClient = prompt("Veuillez indiquer le nom et prénom à faire figurer dans le devis SVP.", "Client sans nom");
            if (coordonneesClient === null) return;
            var maintenant = new Date();


            $("#popup-attente").css({
                left: (window.innerWidth / 2) - ($("#popup-attente").width() / 2) + 'px',
                top: (window.innerHeight / 2) - ($("#popup-attente").height() / 2) + 'px'
            });
            $("#overlay").show();
            $("#popup-attente").show();

            // On prend tous les screenshots dans le bon ordre et dans le bon mode...
            if (!$("span:contains('ossatureBois')").parent().find("input[type='checkbox']").prop('checked'))
                $("span:contains('ossatureBois')").click();
            if (!$("span:contains('afficherCotes')").parent().find("input[type='checkbox']").prop('checked'))
                $("span:contains('afficherCotes')").click();

            // 1 - la vue d'implantation
            activeCamera = cameraOrtho;
            scene.getObjectByName('ground').material = blankMaterial;
            scene.getObjectByName('boussole').material.color = COLOR_ARRAY['noir'];
            changerCouleurTextes(COLOR_ARRAY['noir']);
            scene.traverse(function (child) {
                if (child.name.includes('floor_excluded'))
                    child.visible = false;
            });
            afficherVueAerienne(modePDF);
            showMainIncrustations();
            hidePignonIncrustations();
            animate();
            screenshot1 = saveAsImage();
            $("#quitter-vue-aerienne").click();

            activeCamera = cameraOrtho;

            // 2 - une vue aérienne du plancher
            showPignonIncrustations();
            changePointOfView("dessus", modePDF);
            if ($("span:contains('afficherToit')").parent().find("input[type='checkbox']").prop('checked'))
                $("span:contains('afficherToit')").click();
            animate();
            screenshot2 = saveAsImage();
            $("span:contains('afficherToit')").click();

            // 3 - une vue aérienne avec charpente
            hidePignonIncrustations();
            if ($("span:contains('afficherPlancher')").parent().find("input[type='checkbox']").prop('checked'))
                $("span:contains('afficherPlancher')").click();
            animate();
            screenshot3 = saveAsImage();

            // Les vues suivantes n'auront pas de cotes.
            scene.getObjectByName('ground').material = groundMaterial;
            scene.traverse(function (child) {
                if (child.name.includes('floor_excluded'))
                    child.visible = true;
            });
            scene.getObjectByName('boussole').material.color = COLOR_ARRAY['blanc'];
            changerCouleurTextes(COLOR_ARRAY['blanc']);
            if ($("span:contains('afficherCotes')").parent().find("input[type='checkbox']").prop('checked'))
                $("span:contains('afficherCotes')").click();

            // 4 - une vue de face
            changePointOfView("avant", modePDF);
            animate();
            screenshot4 = saveAsImage();

            // 5 - une vue de derrière
            changePointOfView("arriere", modePDF);
            animate();
            screenshot5 = saveAsImage();

            // 6 - une vue de gauche
            changePointOfView("gauche", modePDF);
            animate();
            screenshot6 = saveAsImage();

            // 7 - une vue de droite
            changePointOfView("droite", modePDF);
            animate();
            screenshot7 = saveAsImage();

            initPositionCamera(cameraOrtho);
            activeCamera = camera;

            // Enfin, quelques vues en perspective
            if ($("span:contains('afficherToit')").parent().find("input[type='checkbox']").prop('checked'))
                $("span:contains('afficherToit')").click();
            camera.position.set(180, 100, 150);
            camera.lookAt(scene.position);
            animate();
            screenshot8 = saveAsImage();

            camera.position.set(-180, 100, -100);
            camera.lookAt(scene.position);
            animate();
            screenshot9 = saveAsImage();


            // Retour à la vue perspective
            changePointOfView("perspective");

            if ($("span:contains('ossatureBois')").parent().find("input[type='checkbox']").prop('checked'))
                $("span:contains('ossatureBois')").click();
            if (!$("span:contains('afficherToit')").parent().find("input[type='checkbox']").prop('checked'))
                $("span:contains('afficherToit')").click();
            if (!$("span:contains('afficherPlancher')").parent().find("input[type='checkbox']").prop('checked'))
                $("span:contains('afficherPlancher')").click();
            animate();


            // Génération du rapport PDF
            jsreport.serverUrl = URL_JSREPORT;

            var donneesBrutes = {},
                modules = new Array(),
                donneesJSON;
            donneesBrutes.nomClient = coordonneesClient;
            donneesBrutes.dateDevis = maintenant.toLocaleDateString('fr-FR');
            donneesBrutes.referenceDevis = maintenant.getFullYear() + '' +
                ((maintenant.getMonth() + 1) < 10 ? '0' + (maintenant.getMonth() + 1) : (maintenant.getMonth() + 1)) + '' +
                maintenant.getDate() + '' + maintenant.getHours() + '' + maintenant.getMinutes();


            // C'est ici qu'on calcule le nombre de charpentes et de pignons : c'est plus simple.
            // On rajoute également dans l'inventaire les kits accessoires, correspondants à chaque construction.
            inventaire["CH1T"] = inventaire["CHTS"] = inventaire["PEXT"] = inventaire["PINT"] = 0;
            inventaire["ACC1"] = inventaire["ACC2"] = inventaire["ACC3"] = inventaire["ACC4"] = 0;
            var nbTraveesActuelles = 0;
            for (var travee in tableauTravees) {
                var numTraveeSuivante = parseInt(travee.substr(travee.indexOf(" ") + 1)) + 1;
                var traveeSuivante = tableauTravees["Travee " + numTraveeSuivante];

                if (tableauTravees[travee].rangDansConstruction === 1) {
                    inventaire["CH1T"]++;
                    inventaire["PEXT"]++;
                    nbTraveesActuelles = 1;
                }

                if (traveeSuivante) {
                    if (traveeSuivante.numConstruction != tableauTravees[travee].numConstruction) {
                        // On se trouve sur la dernière travée de cette construction.
                        inventaire["PEXT"]++;
                        if (nbTraveesActuelles > 0) inventaire["ACC" + nbTraveesActuelles]++;
                    } else {
                        // Il existe une autre travée dans la même construction
                        inventaire["PINT"]++;
                        inventaire["CHTS"]++;
                        nbTraveesActuelles++;
                    }
                } else {
                    inventaire["PEXT"]++;
                    if (nbTraveesActuelles > 0) inventaire["ACC" + nbTraveesActuelles]++;
                }
            }


            // On récupère la liste des modules présents sur le projet et on estime le coût global.
            var coutEstimeBas = 0,
                coutEstimeHaut = 0;
            var keys = Object.keys(inventaire).sort();
            for (var i = 0, key = keys[0]; i < keys.length; key = keys[++i]) {
                var correspondance = key;
                var module = {};
                for (var produit in PRODUITS) {
                    if (PRODUITS[produit].codeModule == key) {
                        correspondance = produit;
                        break;
                    }
                }
                module.codeModule = key;
                module.quantite = inventaire[key];
                module.referenceModule = PRODUITS[correspondance]['libelleModule'];
                modules.push(module);
                coutEstimeBas += (module.quantite * PRODUITS[correspondance].coutFourchetteBasse);
                coutEstimeHaut += (module.quantite * PRODUITS[correspondance].coutFourchetteHaute);
            }

            donneesBrutes.modules = modules;
            donneesBrutes.coutEstimeBas = coutEstimeBas;
            donneesBrutes.coutEstimeHaut = coutEstimeHaut;
            donneesBrutes.screenshot1 = screenshot1;
            donneesBrutes.screenshot2 = screenshot2;
            donneesBrutes.screenshot3 = screenshot3;
            donneesBrutes.screenshot4 = screenshot4;
            donneesBrutes.screenshot5 = screenshot5;
            donneesBrutes.screenshot6 = screenshot6;
            donneesBrutes.screenshot7 = screenshot7;
            donneesBrutes.screenshot8 = screenshot8;
            donneesBrutes.screenshot9 = screenshot9;
            donneesJSON = JSON.stringify(donneesBrutes);

            var request = {
                template: {
                    name: "devis",
                    recipe: "phantom-pdf",
                    engine: "handlebars",
                    phantom: {
                        "format": "A4",
                        "orientation": "landscape",
                        "headerHeight": "0cm",
                        "footer": "<div style='text-align:right;font-size:12px'>Dossier {{nomClient }} - page {#pageNum}/{#numPages}</div>",
                        "footerHeight": "0.5cm"
                    }
                },
                data: donneesJSON
            };

            jsreport.renderAsync(request).then(function (res) {
                res.download('devis_maninghem.pdf')
                $("#popup-attente").hide();
                $("#overlay").hide();
            });
        };
    };

    var options = {
        Ajouter: function () {

            /* Les cas où l'ajout est interdit sont :
                1 - nb maxi de travées (au total) atteint (déjà géré dans creeTravee)
                2 - on atteint le nb maxi de travées par construction */
            if (nbTravees > 1) {
                var voisine = tableauTravees[PREFIXE_TRAVEE + nbTravees];
                if (voisine['rangDansConstruction'] >= NB_TRAVEES_MAXI) {
                    alerte("Vous avez atteint le nombre maximal de travées autorisées (" + NB_TRAVEES_MAXI + ").");
                    return;
                }
            }

            if (nbOuvertures > 0) {
                if (!confirm("Vous allez perdre toutes les ouvertures déjà créées. Continuer ?")) return;
                supprimerToutesOuvertures();
            }

            // On repasse volontairement en mode avec textures.
            if ($("span:contains('ossatureBois')").parent().find("input[type='checkbox']").prop('checked'))
                $("span:contains('ossatureBois')").click();

            var travee = creerTravee();
            if (travee) traitementCreationTravee(travee);
        },

        Supprimer: function () {

            if (nbTravees == 1) {
                alerte("Au moins une travée requise.");
                return;
            }
            if (nbOuvertures > 0) {
                if (!confirm("Vous allez perdre toutes les ouvertures déjà créées. Continuer ?")) return;
                supprimerToutesOuvertures();
            }

            // On repasse volontairement en texture classique.
            if ($("span:contains('ossatureBois')").parent().find("input[type='checkbox']").prop('checked'))
                $("span:contains('ossatureBois')").click();

            var nomTravee = PREFIXE_TRAVEE + nbTravees;
            var travee = scene.getObjectByName(nomTravee);
            scene.remove(travee);
            delete tableauTravees[nomTravee];
            tableauTravees.length--;

            // Suppression d'une travée -> on décale suivant X tout le monde vers la droite.
            for (var i = nbTravees - 1; i > 0; i--) {
                var traveePrecedente = scene.getObjectByName(PREFIXE_TRAVEE + i);
                traveePrecedente.translateX(LARGEUR_TRAVEE / 2);
                tableauTravees[traveePrecedente.name]['positionX'] += LARGEUR_TRAVEE / 2;
            }
            retirerObjetModifiable(nomTravee);
            nbTravees--;

            // On raffiche les cloisons de la travée de gauche
            var voisine = scene.getObjectByName(PREFIXE_TRAVEE + nbTravees);
            voisine.children[indicePDAV].visible = voisine.children[indicePDAR].visible = true;
            voisine.children[indiceToit].children[indicePignonDroit].visible = true;

            // On modifie l'incrustation pour les pignons de toiture.
            modifierIncrustation(voisine.name, 'PD', 'PEXT', true);
            hidePignonIncrustations();

            recalculerConstructions();
            incrusterCotes();

            // On déplace également la boussole pour qu'elle soit toujours à la même distance de la droite de la construction
            scene.getObjectByName('boussole').position.x = tableauTravees["Travee " + nbTravees].positionX + 50;
        }
    }

    var myGui = new dat.GUI();
    var guitravees = myGui.addFolder('Gestion des travées');
    guitravees.add(options, 'Ajouter');
    guitravees.add(options, 'Supprimer');
    guitravees.open();


    var guiEnv = myGui.addFolder("Préférences d'affichage");

    guiEnv.add(controller, 'afficherToit').onChange(function (actif) {

        for (var j = 1; j <= nbTravees; j++) {
            var leToit = scene.getObjectByName(PREFIXE_TRAVEE + j + '>Toit');
            if (!actif) {
                for (var i = 0; i < leToit.children.length; i++) {
                    if (leToit.children[i].name.includes('toit')) {
                        leToit.children[i].visible = false;
                    }
                }
            } else {
                for (var i = 0; i < leToit.children.length; i++) {
                    if (leToit.children[i].name.includes('toit')) {
                        leToit.children[i].visible = true;
                    }
                }
            }
        }
    });


    guiEnv.add(controller, 'afficherPlancher').onChange(function (actif) {
        if (!actif) {
            for (var i = 1; i <= nbTravees; i++) {
                var travee = scene.getObjectByName(PREFIXE_TRAVEE + i);
                travee.children[indiceRoof].visible = false;

                travee.children[indiceRoof].visible = false;
            }
        } else {
            for (var i = 1; i <= nbTravees; i++) {
                var travee = scene.getObjectByName(PREFIXE_TRAVEE + i);
                travee.children[indiceRoof].visible = true;
            }
        }
    });


    guiEnv.add(controller, 'afficherCotes').onChange(function (actif) {

        var cotesX = scene.getObjectByName('CoteX');
        var cotesY = scene.getObjectByName('CoteY');

        if (!actif) {
            if (cotesX) cotesX.visible = false;
            if (cotesY) cotesY.visible = false;
        } else {
            if (cotesX) cotesX.visible = true;
            if (cotesY) cotesY.visible = true;
        }
    });


    guiEnv.add(controller, 'ossatureBois').onChange(function (afficherBois) {

        var isTravee = new RegExp("^" + PREFIXE_TRAVEE + "[1-8]>AV|AR|PGAV|PGAR|PDAV|PDAR$");

        scene.traverse(function (child) {

            if (afficherBois) {

                if (child instanceof THREE.Mesh &&
                    !child.name.includes('Vitre') &&
                    !child.name.includes('Porte') &&
                    child.name != 'ground' &&
                    child.name != 'boussole') {

                    switch (child.material) {

                        case wallMaterial:
                            if (isTravee.test(child.name)) {
                                child.material = MPL_Material;
                                // Il faut récupérer le type d'ouverture présent sur le module.
                                objetsModifiables.forEach(function (objet) {
                                    if (objet.name.includes(child.name + ">Ouverture")) {
                                        var module = objet.name.substr(objet.name.lastIndexOf(' ') + 1, objet.name.length);

                                        switch (module) {
                                            case "PE":
                                                child.material = MPE_Material;
                                                break;
                                            case "F1":
                                                child.material = MF1_Material;
                                                break;
                                            case "F2":
                                                child.material = MF2_Material;
                                                break;
                                            case "PE+F1":
                                                child.material = MPEF_Material;
                                                break;
                                            case "PF":
                                                child.material = MPF_Material;
                                                break;
                                            case "PO":
                                                child.material = MPI_Material;
                                                break;
                                            case "PG1":
                                                child.material = MPG1_Material;
                                                break;
                                            case "PG2":
                                                child.material = MPG2_Material;
                                                break;
                                        }
                                    }
                                });
                            }
                            break;

                        case pignonMaterial:
                            child.material = PEXT_Material;
                            break;

                        case roofMaterial:
                            child.material = CH1T_Material;
                            var newName = child.name.replace('excluded', 'transparent');
                            child.name = newName;
                            break;

                    }
                }

                if (child instanceof THREE.Group && child.name.includes('Ouverture') && !child.name.includes(' PO')) {
                    child.visible = false;
                }
            } else {

                // Texture d'origine
                if (child instanceof THREE.Mesh) {
                    if (!child.name.includes('Vitre') && !child.name.includes('Porte')) {

                        if (isTravee.test(child.name))
                            child.material = wallMaterial;
                    }

                    if (child.material == PEXT_Material) {
                        child.material = pignonMaterial;
                    }

                    if (child.material == CH1T_Material) {
                        child.material = roofMaterial;
                        var newName = child.name.replace('transparent', 'excluded');
                        child.name = newName;
                    }
                }

                if (child instanceof THREE.Group && child.name.includes('Ouverture') && !child.name.includes(' PO')) {
                    child.visible = true;
                }
            }
        });
    });
    guiEnv.open();


    var guiMisc = myGui.addFolder("Diverses actions");
    guiMisc.add(controller, 'genererDevis');
    guiMisc.add(controller, 'exporterCeProjet');
    guiMisc.add(controller, 'importerUnProjet');
    guiMisc.open();

}
