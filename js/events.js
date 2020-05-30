import {
    camera,
    cameraOrtho,
    renderer
} from "./environment.js"

import {
    COLOR_ARRAY,
    topMaterial,
    glassMaterial,
    selectedGlassMaterial,
    selectedTopMaterial,
    wallBoisMaterial
} from "./materials.js"

import {
    info,
    alerte,
    log,
    extraireNomTravee,
    extraireFace,
    verifierContraintes,
    mergeGroups,
    retirerObjetModifiable,
    faceInterieureOuExterieure,
    supprimerObjetDunGroupe
} from "./main.js"

import {
    displayContextualMenu,
    displayOpenings,
    chooseFloorHole,
    unSelect,
    changePointOfView
} from "./gui.js"

import {
    supprimerOuverture,
    decalerTravee,
    creerOuverture
} from "./objects.js"



/*******************************    Gestion du clic sur le menu déroulant    **************************************/
$(".liste-deroulante").click(function (e) {

    e.preventDefault();

    var action = $(e.target).attr('data-action');
    var autorise = $(e.target).attr('class');

    if (autorise && autorise.indexOf('disabled') > -1) {
        var message = "Opération non autorisée : ";
        if (action == 'addOpening') message += "une ouverture est déjà présente sur ce mur.";
        if (action.startsWith('move')) message += "décalage impossible dans cette configuration.";
        alerte(message);
        return;
    }

    switch (action) {
        case 'deleteOuverture':
            supprimerOuverture(scene.getObjectByName(objetSelectionne).parent.name);
            break;
        case 'addOpening':
            displayOpenings(objetSelectionne, faceInterieureOuExterieure(objetSelectionne));
            break;
        case 'moveFrontTravee':
            decalerTravee(extraireNomTravee(objetSelectionne), 'front');
            break;
        case 'moveBackTravee':
            decalerTravee(extraireNomTravee(objetSelectionne), 'back');
            break;
        case 'chooseFloorHole':
            chooseFloorHole(extraireNomTravee(objetSelectionne));
            break;
        case 'unselect':
            unSelect();
            break;
        default:
            alert('Autre action inconnue !');
            break;
    }
    $("#div-menu-contextuel").hide();
});


/*******************************  Gestion des clics dans la popup des planchers  *********************************/
$("#popup-plancher").click(function (e) {
    e.stopImmediatePropagation();
    if ($(e.target).attr('id') == 'popup-alerte-annuler') {
        $(".popup-ouverture").hide();
        $("#overlay").hide();
        unSelect();
        return;
    }

    if (!$(e.target).parent().hasClass('disabled')) {

        // On supprime l'ancien plancher et on le recrée avec la trappe au bon endroit
        var nomTravee = extraireNomTravee($("#traveeSelectionnee").val());
        var nomFace = extraireFace($("#traveeSelectionnee").val());

        var plancher = scene.getObjectByName(objetSelectionne);
        if (plancher) {
            var positionTrappe = $(e.target).parent().attr('id');
        }

        $(".popup-ouverture").hide();
        $("#overlay").hide();
        unSelect();
    }
});



/*******************************  Gestion des clics dans la popup des ouvertures  *********************************/
$(".popup-ouverture").click(function (e) {
    e.preventDefault();

    if ($(e.target).attr('id') == 'popup-alerte-annuler') {
        $(".popup-ouverture").hide();
        $("#overlay").hide();
        unSelect();
        return;
    }

    if (!$(e.target).parent().hasClass('disabled')) {
        var nomTravee = extraireNomTravee($("#traveeSelectionnee").val());
        var nomFace = extraireFace($("#traveeSelectionnee").val());

        if ($(e.target).parent().attr('id') != 'PE+F1') {
            scene.add(creerOuverture(nomTravee, nomFace, $(e.target).parent().attr('id')));
        } else {

            // Cas particulier du combo PE + F1 :
            // on créé chacune de 2 ouvertures puis on régularise (nb d'ouvertures, score VT, etc...)
            var porte = creerOuverture(nomTravee, nomFace, 'PE');
            var fenetre = creerOuverture(nomTravee, nomFace, 'F1');

            var nouveauGroupe = new THREE.Group();
            nouveauGroupe = mergeGroups(porte, fenetre);
            nouveauGroupe.name = nomTravee + '>' + nomFace + '>Ouverture ' + 'PE+F1';
            objetsModifiables.push(nouveauGroupe);
            tableauTravees[nomTravee]['nb_ouvertures_' + nomFace]--;
            tableauTravees[nomTravee]['vt_' + nomFace] = PRODUITS['PE+F1']['VT'];
            nbOuvertures--;

            scene.add(nouveauGroupe);
            scene.remove(porte);
            retirerObjetModifiable(porte.name);
            scene.remove(fenetre);
            retirerObjetModifiable(fenetre.name);
            var newIncrustationModules = new THREE.Group();
            newIncrustationModules = supprimerObjetDunGroupe(incrustationModules, nomTravee + '>' + nomFace + '>Ouverture PE>Incrustation');
            newIncrustationModules = supprimerObjetDunGroupe(incrustationModules, nomTravee + '>' + nomFace + '>Ouverture F1>Incrustation');
            newIncrustationModules.add()
            incrustationModules = newIncrustationModules;

            // On remplace la texture classique du module par la version "armatures bois", pour voir...
            var mur = scene.getObjectByName(nomTravee + ">" + nomFace);
            if (mur) {
                var plaquage = new THREE.Mesh(new THREE.PlaneGeometry(LONGUEUR_TRAVEE / 2 - EPAISSEUR_MUR, HAUTEUR_TRAVEE), wallBoisMaterial);
                plaquage.rotation.y = -Math.PI / 2;
                plaquage.position.x += (LARGEUR_TRAVEE / 2) - EPAISSEUR_MUR - 0.01;
                plaquage.position.z += (LARGEUR_TRAVEE / 2) - (EPAISSEUR_MUR / 2);
                scene.add(plaquage);

            }

        }
        $(".popup-ouverture").hide();
        $("#overlay").hide();
        unSelect();
    }
});



/**********************************  Changement d'angle de vue  ***********************************/
$("#changement-vue div").click(function (e) {
    e.preventDefault();

    var direction = $(e.target).parent().attr('id');
    if (direction == "aerien") {
        //        guiEnv.__controllers[0].setValue(false);
        activeCamera = cameraOrtho;
        scene.add(incrustationModules);
        $("#quitter-vue-aerienne").show();
    } else changePointOfView(direction);
});

/*******************************    Clic pour quitter le mode vue aérienne    **************************************/
$("#quitter-vue-aerienne").click(function (e) {
    e.preventDefault();
    $("#quitter-vue-aerienne").hide();
    camera.position.set(60, 40, 160);
    activeCamera = camera;
    scene.remove(incrustationModules);
});





export function onMouseClick(event) {
    var objetTouche, faceTouchee;
    var _faceExterneMur = 10;

    if ($("#quitter-vue-aerienne").css("display") == "flex") return;

    event.preventDefault();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    mouse.left = event.pageX;
    mouse.top = event.pageY;

    raycaster.setFromCamera(mouse, camera);

    // Il faut penser à rajouter les objets sur lesquels on veut pouvoir cliquer dans objetsModifiables[]
    var intersects = raycaster.intersectObjects(objetsModifiables, true);

    if (intersects.length === 0) { // On clique en-dehors d'un objet cliquable.
        unSelect();
        return;
    }

    if (DEBUG) {
        log('Vous avez cliqué sur : ');
        log(intersects);
    }

    // Pour éviter les intersections alors que le menu contextuel est affiché.
    if ($('#div-menu-contextuel').css('opacity') == 1) return;

    objetTouche = intersects[0].object;
    faceTouchee = intersects[0].faceIndex;

    // On n'intercepte volontairement pas certains objets
    if (objetTouche.name == 'excluded') return; // Pour exclure certains objets de l'intersection (ex : cadre des fenêtres ou toit)
    if (objetTouche.name.includes('Travee') && !objetTouche.parent.name.includes('>') && faceTouchee < _faceExterneMur) return; // Façade != façade avant du mur

    // Pour le cas particulier du toit, qui doit laisser passer le raycast, on recherche le prochain objet ni transparent ni exclu.
    var trouve = false;
    if (objetTouche.name == 'transparent') {
        for (var i = 1; i < intersects.length; i++) {
            if (intersects[i].object.name != 'transparent' && intersects[i].object.name != 'excluded') {
                objetTouche = intersects[i].object;
                faceTouchee = intersects[i].faceIndex;
                trouve = true;
                break;
            }
        }
        if (!trouve) return;
    }

    // S'il existe déjà une précédente sélection, on l'efface.
    if (facesSelectionnees.length > 0) unSelect()

    var face = Math.floor(faceTouchee / 2); // Bidouille pour pouvoir sélectionner les 2 faces composant une façade.

    for (var j = 0; j < 2; j++) {
        var numFace = face * 2 + j;
        if (objetTouche.parent.name.includes('>'))
            objetTouche.material = selectedGlassMaterial;
        else {
            if (objetTouche.name.includes('plancher')) {
                objetTouche.material = selectedTopMaterial;
            } else {
                objetTouche.geometry.faces[numFace].color.set(COLOR_ARRAY['highlight']);
            }
        }
        objetTouche.geometry.elementsNeedUpdate = true;
        facesSelectionnees.push(numFace);
        objetSelectionne = objetTouche.name;
        info(objetTouche);
        displayContextualMenu(objetTouche, mouse.left, mouse.top);
    }
}


export function onMouseMove(event) {
    event.preventDefault();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    mouse.left = event.pageX;
    mouse.top = event.pageY;
}


export function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
