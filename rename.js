// Importer les modules nécessaires
const fs = require('fs');
const path = require('path');

// Dossiers source et de destination
const dossierSource = path.join(__dirname, '/bucket');
const dossierImages = path.join(__dirname, '/renamed-images');
const dossierVideos = path.join(__dirname, '/renamed-videos');
const dossierManuel = path.join(__dirname, '/to-renamed-manually');

// Extensions à gérer
const extensionsImages = ['.jpg', '.jpeg', '.png', '.gif'];
const extensionsVideos = ['.mp4', '.avi', '.mov', '.mkv', '.3gp'];

// Fonction pour extraire une date au format AAAAMMJJ
const extraireDate = (nomFichier) => {
    const regex = /(?:\D|^)(\d{4})(\d{2})(\d{2})(?:\D|$)|(?:^|\D)(\d{4})-(\d{2})-(\d{2})(?:\D|$)/;
    const match = nomFichier.match(regex);
    if (match) {
        return match[1] && match[2] && match[3] ? `${match[1]}${match[2]}${match[3]}` : `${match[4]}${match[5]}${match[6]}`;
    }
    return null;
};

// Fonction pour extraire un timestamp et le convertir en date AAAAMMJJ
const extraireTimestamp = (nomFichier) => {
    const regex = /(\d{10,13})/; // Recherche un timestamp Unix (secondes ou millisecondes)
    const match = nomFichier.match(regex);
    if (match) {
        const timestamp = parseInt(match[1]);
        const date = new Date(timestamp.toString().length === 13 ? timestamp : timestamp * 1000);
        return date.toISOString().slice(0, 10).replace(/-/g, '');
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
let compteurManuel = 0;

// Lire l'option fournie lors de l'exécution du script
const option = process.argv[2];
const suffixe = option === 'low' ? '_low_quality' : '';

// Lire les fichiers dans le dossier source
fs.readdir(dossierSource, (err, fichiers) => {
    if (err) {
        console.error('Erreur lors de la lecture du dossier source :', err);
        return;
    }

    const nomsUtilisesImages = {};
    const nomsUtilisesVideos = {};

    fichiers.forEach((fichier) => {
        const cheminComplet = path.join(dossierSource, fichier);

        fs.stat(cheminComplet, (err, stats) => {
            if (err) {
                console.error('Erreur lors de l\'analyse du fichier :', err);
                erreurs++;
                return;
            }

            if (stats.isFile()) {
                const extension = path.extname(fichier).toLowerCase();
                let date = extraireDate(fichier) || extraireTimestamp(fichier);
                let timestamp = Date.now();

                if (date) {
                    if (extensionsImages.includes(extension)) {
                        nomsUtilisesImages[date] = nomsUtilisesImages[date] || 0;
                        nomsUtilisesImages[date]++;

                        const nouveauNom = `${date}_${nomsUtilisesImages[date]}_${timestamp}${suffixe}${extension}`;
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
                        nomsUtilisesVideos[date] = nomsUtilisesVideos[date] || 0;
                        nomsUtilisesVideos[date]++;

                        const nouveauNom = `${date}_${nomsUtilisesVideos[date]}_${timestamp}${suffixe}${extension}`;
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
                    compteurManuel++;
                    const nouveauNomManuel = `_manual_${compteurManuel}_${timestamp}${suffixe}${extension}`;
                    const cheminDestination = path.join(dossierManuel, nouveauNomManuel);

                    fs.copyFile(cheminComplet, cheminDestination, (err) => {
                        if (err) {
                            console.error('Erreur lors du déplacement du fichier manuel :', err);
                            erreurs++;
                        } else {
                            console.log(`Fichier déplacé et renommé manuellement : ${fichier} -> ${nouveauNomManuel}`);
                            aRenommerManuellement++;
                        }
                    });
                }
            }
        });
    });
});
