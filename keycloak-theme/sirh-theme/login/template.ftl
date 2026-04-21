<#macro registrationLayout bodyClass="" displayInfo=false displayMessage=true displayRequiredFields=false showAnotherWayIfPresent=true>
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="robots" content="noindex, nofollow">
    <title>${msg("loginTitle",(realm.displayName!''))}</title>
    <link rel="icon" href="${url.resourcesPath}/img/favicon.ico" />
    <link href="${url.resourcesCommonPath}/node_modules/@patternfly/patternfly/patternfly.min.css" rel="stylesheet" />
    <link href="${url.resourcesPath}/css/login.css" rel="stylesheet" />
</head>
<body class="sirh-body">
    <div id="kc-custom-wrapper">
        <#nested "form">
    </div>
</body>
</html>
</#macro>
