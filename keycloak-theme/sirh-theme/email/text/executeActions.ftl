<#-- Version texte brut pour les clients mail qui ne supportent pas le HTML -->
<#assign isActivation = ((user.attributes.activationFlow)!"") == "true">
<#if isActivation>
SIRH - Activation de votre compte
=================================

Bonjour ${user.firstName!user.username},

Votre compte SIRH a ete cree par votre administrateur RH. Pour l'activer,
definissez votre mot de passe en cliquant sur le lien ci-dessous :

${link}

Ce lien est valable ${linkExpirationFormatter(linkExpiration)}.
Passe ce delai, demandez a votre service RH d'en regenerer un.

Vous n'attendiez pas ce message ? Verifiez aupres de votre service RH
avant de cliquer sur le lien.
<#else>
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
</#if>

--
SIRH - Plateforme RH Securisee
Email automatique, merci de ne pas repondre.
