// Importer les modules nécessaires
const fs = require('fs');
const path = require('path');

// Dossiers source et de destination
const dossierSource = path.join(__dirname, '../bucket');
const dossierImages = path.join(__dirname, '../renamed-images');
const dossierVideos = path.join(__dirname, '../renamed-videos');
const dossierManuel = path.join(__dirname, '../to-renamed-manually');

// Extensions à gérer
const extensionsImages = ['.jpg', '.jpeg', '.png', '.gif'];
const extensionsVideos = ['.mp4', '.avi', '.mov', '.mkv'];

// Fonction pour extraire une date au format AAAAMMJJ
const extraireDate = (nomFichier) => {
    const regex = /(?:\D|^)(\d{4})(\d{2})(\d{2})(?:\D|$)|(?:^|\D)(\d{4})-(\d{2})-(\d{2})(?:\D|$)/; // Regex pour extraire une date AAAAMMJJ ou 2013-12-06
    const match = nomFichier.match(regex);
    if (match) {
        return match[1] && match[2] && match[3]
            ? `${match[1]}${match[2]}${match[3]}`
            : `${match[4]}${match[5]}${match[6]}`;
    }
    return null;
};

// Créer les dossiers de destination si nécessaire
const creerDossier = (dossier) => {
    if (!fs.existsSync(dossier)) {
        fs.mkdirSync(dossier, { recursive: true });
    }
};
creerDossier(dossierImages);
creerDossier(dossierVideos);
creerDossier(dossierManuel);

// Variables pour suivre les erreurs
let erreurs = 0;
let succes = 0;
let aRenommerManuellement = 0;

// Lire les fichiers dans le dossier source
fs.readdir(dossierSource, (err, fichiers) => {
    if (err) {
        console.error('Erreur lors de la lecture du dossier source :', err);
        return;
    }

    const nomsUtilisesImages = {}; // Suivi des noms utilisés pour chaque date (images)
    const nomsUtilisesVideos = {}; // Suivi des noms utilisés pour chaque date (vidéos)

    fichiers.forEach((fichier) => {
        const cheminComplet = path.join(dossierSource, fichier);

        // Vérifier que c'est bien un fichier
        fs.stat(cheminComplet, (err, stats) => {
            if (err) {
                console.error('Erreur lors de l\'analyse du fichier :', err);
                erreurs++;
                return;
            }

            if (stats.isFile()) {
                const extension = path.extname(fichier).toLowerCase();
                const date = extraireDate(fichier);

                if (date) {
                    const timestamp = Date.now();
                    if (extensionsImages.includes(extension)) {
                        // Renommer et copier les images avec un compteur unique, timestamp et suffixe "_low_quality"
                        nomsUtilisesImages[date] = nomsUtilisesImages[date] || 0;
                        nomsUtilisesImages[date]++;

                        const nouveauNom = `${date}_${nomsUtilisesImages[date]}_${timestamp}_low_quality${extension}`;
                        const cheminDestination = path.join(dossierImages, nouveauNom);

                        fs.copyFile(cheminComplet, cheminDestination, (err) => {
                            if (err) {
                                console.error('Erreur lors de la copie de l\'image :', err);
                                erreurs++;
                            } else {
                                console.log(`Image copiée et renommée : ${fichier} -> ${nouveauNom}`);
                                succes++;
                            }
                        });
                    } else if (extensionsVideos.includes(extension)) {
                        // Renommer et copier les vidéos avec un compteur unique, timestamp et suffixe "_low_quality"
                        nomsUtilisesVideos[date] = nomsUtilisesVideos[date] || 0;
                        nomsUtilisesVideos[date]++;

                        const nouveauNom = `${date}_${nomsUtilisesVideos[date]}_${timestamp}_low_quality${extension}`;
                        const cheminDestination = path.join(dossierVideos, nouveauNom);

                        fs.copyFile(cheminComplet, cheminDestination, (err) => {
                            if (err) {
                                console.error('Erreur lors de la copie de la vidéo :', err);
                                erreurs++;
                            } else {
                                console.log(`Vidéo copiée et renommée : ${fichier} -> ${nouveauNom}`);
                                succes++;
                            }
                        });
                    } else {
                        console.log(`Fichier ignoré (ni image ni vidéo) : ${fichier}`);
                    }
                } else {
                    // Déplacer les fichiers sans date dans le dossier manuel
                    const cheminDestination = path.join(dossierManuel, fichier);

                    fs.copyFile(cheminComplet, cheminDestination, (err) => {
                        if (err) {
                            console.error('Erreur lors du déplacement du fichier manuel :', err);
                            erreurs++;
                        } else {
                            console.log(`Fichier déplacé pour renommage manuel : ${fichier}`);
                            aRenommerManuellement++;
                        }
                    });
                }
            }
        });
    });

    // Attendre que toutes les opérations soient terminées
    const attente = setInterval(() => {
        if (succes + erreurs + aRenommerManuellement === fichiers.length) {
            clearInterval(attente);
            console.log("\n================ Résultat final ================");
            console.log(`✅ Succès : ${succes} fichiers copiés et renommés.`);
            if (erreurs > 0) {
                console.error(`🚨 Erreurs : ${erreurs} fichiers n'ont pas pu être copiés.`);
            } else {
                console.log("✅ Aucun fichier n'a rencontré d'erreur.");
            }
            if (aRenommerManuellement) {
                console.log(`🚨🚨🚨 À renommer manuellement : ${aRenommerManuellement} fichiers.`);
            } else {
                console.log(`✅ Aucun fichier à renommer manuellement.`);
            }
            console.log("================================================");
        }
    }, 500);
});
