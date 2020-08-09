import {
    creerTravee,
    creerOuverture,
    decalerTravee,
    supprimerToutesOuvertures
} from "./objects.js"

import {
    glassMaterial,
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
    PEXT_Material,
    PINT_Droite_Material,
    PINT_Gauche_Material,
    CH1T_Material,
    COLOR_ARRAY
}
from "./materials.js"

import {
    info,
    alerte,
    log,
    retirerObjetModifiable,
    extraireFace,
    extraireNomTravee,
    verifierContraintes,
    importScene,
    exportScene,
    toggleIncrustations,
    incrusterCotes,
    animate,
    recalculerConstructions
} from "./main.js"

import {
    camera,
    cameraOrtho,
    canvas,
    renderer,
    aspectRatio
} from "./environment.js"

export function unSelect() {

    /* On masque le menu déroulant...
       on déselectionne tous les objets à l'IHM,
       puis on vide les variables  */

    $("#div-menu-contextuel").hide();

    if (objetSelectionne) {
        var objet = scene.getObjectByName(objetSelectionne);

        for (var i = 0; i < facesSelectionnees.length; i++) {
            if (objet.parent.name.includes('>')) {
                if (objet.name.includes('Portique')) {
                    objet.material = wallMaterial;
                } else {
                    if (objet.name.includes('PINT')) {
                        for (var k = 0; k < 12; k++) {
                            objet.geometry.faces[k].color.set(COLOR_ARRAY['blanc']);
                        }

                    } else
                        objet.material = glassMaterial;
                }
            } else
                objet.geometry.faces[facesSelectionnees[i]].color.set(COLOR_ARRAY['blanc']);
        }
        objet.geometry.elementsNeedUpdate = true;
    }
    facesSelectionnees.length = 0;
    objetSelectionne = '';

    if ($("#message-info").prop("class") == "normal")
        info(null);
}



export function changePointOfView(direction) {

    switch (direction) {
        case 'dessus':
            camera.position.set(0, 200, 0);
            camera.lookAt(scene.position);
            info("Vue de dessus");
            break;
        case 'avant':
            camera.position.set(0, 10, 150);
            camera.lookAt(scene.position);
            info("Vue avant");
            break;
        case 'arriere':
            camera.position.set(0, 10, -150);
            camera.lookAt(scene.position);
            info("Vue arrière");
            break;
        case 'gauche':
            camera.position.set(-150, 10, 0);
            camera.lookAt(scene.position);
            info("Vue de gauche");
            break;
        case 'droite':
            camera.position.set(150, 10, 0);
            camera.lookAt(scene.position);
            info("Vue de droite");
            break;
        case 'perspective':
            camera.position.set(60, 40, 160);
            camera.lookAt(scene.position);
            break;
    }
}


export function afficherVueAerienne() {
    $("#changement-vue div#aerien").addClass('actif');

    $("div:contains('Close Controls')").click();

    // On masque toit et plancher (si pas déjà masqués)
    if ($("span:contains('afficherToit')").parent().find("input[type='checkbox']").prop('checked'))
        $("span:contains('afficherToit')").click();

    if ($("span:contains('afficherPlancher')").parent().find("input[type='checkbox']").prop('checked'))
        $("span:contains('afficherPlancher')").click();

    var borne;
    if (nbTravees === 1) borne = 150;
    else borne = (150 * 0.5) * nbTravees;
    cameraOrtho.left = -(borne * aspectRatio) / 2;
    cameraOrtho.right = (borne * aspectRatio) / 2;
    cameraOrtho.top = borne / 2;
    cameraOrtho.bottom = -borne / 2;
    activeCamera = cameraOrtho;

    $("#changement-vue div#aerien").addClass('actif');
    toggleIncrustations();
    $("#vue-aerienne").show();
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
            addMenu("Positionner la trappe d'accès", 'chooseFloorHole');
        } else {

            if (objet.name.includes('PINT')) {
                if (objet.material == PEXT_Material)
                    addMenu("Créer une ouverture", 'addPignonOpening');
                else
                    addMenu("Supprimer cette ouverture", 'deletePignonOpening');
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

        this.exporter = function () {
            /*
            scene.updateMatrixWorld();
            exportScene();
            */
        };

        this.importer = function () {
            /*
            // Pour demander à l'utilisateur de choisir son fichier local
            $('#file-input').trigger('click');
            alert($('#file-input'));


            for (var i = 0; i < nbTravees; i++) {
                scene.remove(scene.getObjectByName(PREFIXE_TRAVEE + parseInt(i + 1)));
            }

            importScene('./js/import/scene.json');
            scene.updateMatrixWorld();
            */
        };

        this.genererDevis = function () {

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

            // On prend tous les screenshots dans le bon ordre...
            activeCamera = cameraOrtho;
            if (!$("span:contains('ossatureBois')").parent().find("input[type='checkbox']").prop('checked'))
                $("span:contains('ossatureBois')").click();

            // 1 - la vue d'implantation
            afficherVueAerienne();
            animate();
            screenshot1 = saveAsImage();
            $("#quitter-vue-aerienne").click();

            // 2 - une vue aérienne du plancher
            activeCamera = cameraOrtho;
            changePointOfView("dessus");
            if ($("span:contains('afficherToit')").parent().find("input[type='checkbox']").prop('checked'))
                $("span:contains('afficherToit')").click();
            animate();
            screenshot2 = saveAsImage();
            $("span:contains('afficherToit')").click();

            // 3 - une vue aérienne avec charpente
            if ($("span:contains('afficherPlancher')").parent().find("input[type='checkbox']").prop('checked'))
                $("span:contains('afficherPlancher')").click();
            animate();
            screenshot3 = saveAsImage();

            // Les vues suivantes n'auront pas de cotes.
            activeCamera = camera;
            if ($("span:contains('afficherCotes')").parent().find("input[type='checkbox']").prop('checked'))
                $("span:contains('afficherCotes')").click();

            // 4 - une vue de face
            changePointOfView("avant");
            animate();
            screenshot4 = saveAsImage();

            // 5 - une vue de derrière
            changePointOfView("arriere");
            animate();
            screenshot5 = saveAsImage();

            // 6 - une vue de gauche
            changePointOfView("gauche");
            animate();
            screenshot6 = saveAsImage();

            // 7 - une vue de droite
            changePointOfView("droite");
            animate();
            screenshot7 = saveAsImage();

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
            jsreport.serverUrl = 'https://vps777206.ovh.net:5488';

            var donneesBrutes = {},
                modules = new Array(),
                donneesJSON;
            donneesBrutes.nomClient = coordonneesClient;
            donneesBrutes.dateDevis = maintenant.toLocaleDateString('fr-FR');
            donneesBrutes.referenceDevis = maintenant.getFullYear() + '' +
                ((maintenant.getMonth() + 1) < 10 ? '0' + (maintenant.getMonth() + 1) : (maintenant.getMonth() + 1)) + '' +
                maintenant.getDate() + '' + maintenant.getHours() + '' + maintenant.getMinutes();

            var comptageModules = new Array();
            for (var produit in PRODUITS) {
                var leModule = PRODUITS[produit].codeModule;
                comptageModules[leModule] = 0;
            }
            comptageModules['MPL'] = (nbTravees * 6) - ((nbTravees - 1) * 2) - nbOuvertures;

            scene.traverse(function (child) {
                var nomModule = child.name;

                if (child.isGroup && nomModule.includes("Ouverture")) {
                    var leModule = nomModule.substring(nomModule.indexOf("Ouverture ") + 10);
                    switch (leModule) {
                        case "PE":
                            comptageModules.MPE++;
                            break;
                        case "F1":
                            comptageModules.MF1++;
                            break;
                        case "F2":
                            comptageModules.MF2++;
                            break;
                        case "PF":
                            comptageModules.MPF++;
                            break;
                        case "PG1":
                            comptageModules.MPG1++;
                            break;
                        case "PG2":
                            comptageModules.MPG2++;
                            break;
                        case "PE+F1":
                            comptageModules.MPEF++;
                            break;
                        case "PO":
                            comptageModules.MPI++;
                            break;
                    }
                }

            });

            for (var leModule in comptageModules) {
                var module = {};
                module.codeModule = leModule;
                switch (leModule) {
                    case "MPL":
                        module.referenceModule = PRODUITS['MU']['libelleModule']
                        break;
                    case "MPE":
                        module.referenceModule = PRODUITS['PE']['libelleModule']
                        break;
                    case "MF1":
                        module.referenceModule = PRODUITS['F1']['libelleModule']
                        break;
                    case "MF2":
                        module.referenceModule = PRODUITS['F2']['libelleModule']
                        break;
                    case "MPF":
                        module.referenceModule = PRODUITS['PF']['libelleModule']
                        break;
                    case "MPG1":
                        module.referenceModule = PRODUITS['PG1']['libelleModule']
                        break;
                    case "MPG2":
                        module.referenceModule = PRODUITS['PG2']['libelleModule']
                        break;
                    case "MPEF":
                        module.referenceModule = PRODUITS['PE+F1']['libelleModule']
                        break;
                    case "MPI":
                        module.referenceModule = PRODUITS['PO']['libelleModule']
                        break;
                }
                module.quantite = comptageModules[leModule];
                modules.push(module);
            }
            donneesBrutes.modules = modules;
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
                        "orientation": "portrait",
                        "headerHeight": "3cm",
                        "footer": "<h4>Mentions légales...</h4>"
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

            if (nbOuvertures > 0) {
                if (!confirm("Vous allez perdre toutes les ouvertures déjà créées. Continuer ?")) return;
                supprimerToutesOuvertures();
            }
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

            // On repasse volontairement en texture classique.
            if ($("span:contains('ossatureBois')").parent().find("input[type='checkbox']").prop('checked'))
                $("span:contains('ossatureBois')").click();

            var travee = creerTravee();
            if (travee) {

                // Rajout d'une travée -> on décale suivant X tout le monde vers la gauche.
                travee.translateX(LARGEUR_TRAVEE / 2 * (nbTravees - 1));
                tableauTravees[travee.name]['positionX'] += (LARGEUR_TRAVEE / 2 * (nbTravees - 1));
                for (var i = nbTravees - 1; i > 0; i--) {
                    var traveePrecedente = scene.getObjectByName(PREFIXE_TRAVEE + i);
                    traveePrecedente.translateX(-LARGEUR_TRAVEE / 2);
                    tableauTravees[traveePrecedente.name]['positionX'] -= LARGEUR_TRAVEE / 2;
                }
                scene.add(travee);

                // A la création d'une travée, on reprend les préférences utilisateur (affichage toit, etc.)
                if (!$("span:contains('afficherToit')").parent().find("input[type='checkbox']").prop('checked')) {
                    var leToit = scene.getObjectByName(PREFIXE_TRAVEE + nbTravees + '>Toit');
                    for (var i = 0; i < leToit.children.length; i++) {
                        if (leToit.children[i].name.includes('toit')) {
                            leToit.children[i].visible = false;
                        }
                    }
                }
                if (!$("span:contains('afficherPlancher')").parent().find("input[type='checkbox']").prop('checked')) {
                    travee.children[indiceRoof].visible = false;
                }


                // La travée doit-elle être décalée suivant Z, car une nouvelle travée aura toujours le même décalage que sa voisine de gauche.
                var decalageVoisine = tableauTravees[PREFIXE_TRAVEE + (nbTravees - 1)]['decalage'];
                if (decalageVoisine != 0) {
                    switch (decalageVoisine) {
                        case 1:
                            decalerTravee(travee.name, 'front');
                            break;
                        default:
                            decalerTravee(travee.name, 'back');
                            break;
                    }
                }

                // On masque les cloisons de la travée de gauche, ainsi que son pignon droit.
                var voisine = scene.getObjectByName(PREFIXE_TRAVEE + (nbTravees - 1));
                voisine.children[indicePDAV].visible = voisine.children[indicePDAR].visible = false;
                voisine.children[indiceToit].children[indicePignonDroit].visible = false;

                // Le pignon séparant les 2 travées devient un pignon intérieur, donc sélectionnable.
                travee.children[indiceToit].children[indicePignonGauche].name = travee.name + ">PINT";
                travee.children[indiceToit].children[indicePignonGauche].material = PEXT_Material;

                recalculerConstructions();
                incrusterCotes();
            }
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

            recalculerConstructions();
            incrusterCotes();
        }
    }

    var myGui = new dat.GUI();
    var guitravees = myGui.addFolder('Gestion des travées');
    guitravees.add(options, 'Ajouter');
    guitravees.add(options, 'Supprimer');
    guitravees.open();


    var guiEnv = myGui.addFolder("Réglages d'affichage");

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

                if ((child instanceof THREE.Mesh) && (!child.name.includes('Vitre') && !child.name.includes('Porte'))) {

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


    var guiMisc = myGui.addFolder("Divers");

    //    guiMisc.add(controller, 'exporter');
    //    guiMisc.add(controller, 'importer');
    guiMisc.add(controller, 'genererDevis');
    guiMisc.open();

}
