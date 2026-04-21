<#-- Version texte brut pour les clients mail qui ne supportent pas le HTML -->
SIRH - Reinitialisation de votre mot de passe
=============================================

Bonjour ${user.firstName!user.username},

Nous avons recu une demande de reinitialisation du mot de passe associe
a votre compte ${user.email}.

Cliquez sur le lien ci-dessous pour definir un nouveau mot de passe :

${link}

Ce lien est valable ${linkExpirationFormatter(linkExpiration)}.
Passe ce delai, vous devrez refaire une demande.

Vous n'avez pas demande de reinitialisation ? Vous pouvez ignorer ce
message en toute securite, votre mot de passe actuel reste inchange.

--
SIRH - Plateforme RH Securisee
Email automatique, merci de ne pas repondre.
