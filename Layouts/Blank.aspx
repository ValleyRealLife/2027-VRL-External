<%@ Page Language="C#" AutoEventWireup="true" Inherits="Rock.Web.UI.RockPage" %>

<!DOCTYPE html>

<html>
<head runat="server">
    <title></title>

    <script src="<%# System.Web.Optimization.Scripts.Url("~/Scripts/Bundles/RockJQueryLatest" ) %>"></script>

    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <%-- As Site.Master: Montserrat, the theme, theme.js (defer). Pages on this
         layout are often shown inside the site's pop-ups (e.g. the Life Group
         details page in the group finder's), so they get the same type, icons
         and behaviour. --%>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap" />

    <link rel="stylesheet" href="<%# ResolveRockUrl("~~/Styles/theme.css", true) %>" />

    <script defer src="<%# ResolveRockUrl("~~/Assets/Scripts/theme.js", true) %>"></script>

    <%-- Inside an iframe (a pop-up): html.is-framed, before first paint. Hides
         Rock's admin footer in the frame (Styles/_rock-blocks.scss). --%>
    <script>if (window.self !== window.top) document.documentElement.classList.add('is-framed');</script>

    <style>
        html, body {
            height: auto;
            width: 100%;
            min-width: 100%;
            background-color: var(--color-interface-softest, #fff);
            margin: 0;
            padding: 0;
            vertical-align: top;
        }
    </style>

</head>

<body class="rock-blank">
    <form id="form1" runat="server">
        <asp:ScriptManager ID="sManager" runat="server" />

        <%-- Inline SVG icon sprite, as Site.Master --%>
        <Rock:Lava ID="lavaIconSprite" runat="server">
            {% include '~~/Assets/Lava/Partials/IconSprite.lava' %}
        </Rock:Lava>

        <asp:UpdateProgress ID="updateProgress" runat="server" DisplayAfter="800">
            <ProgressTemplate>
                <div class="updateprogress-status">
                    <div class="updateprogress-loader">
                        <svg viewBox="0 0 135 140" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><rect y="10" width="15" height="120" rx="6"><animate attributeName="height" begin="0.5s" dur="1s" values="120;110;100;90;80;70;60;50;40;140;120" calcMode="linear" repeatCount="indefinite"/><animate attributeName="y" begin="0.5s" dur="1s" values="10;15;20;25;30;35;40;45;50;0;10" calcMode="linear" repeatCount="indefinite"/></rect><rect x="30" y="10" width="15" height="120" rx="6"><animate attributeName="height" begin="0.25s" dur="1s" values="120;110;100;90;80;70;60;50;40;140;120" calcMode="linear" repeatCount="indefinite"/><animate attributeName="y" begin="0.25s" dur="1s" values="10;15;20;25;30;35;40;45;50;0;10" calcMode="linear" repeatCount="indefinite"/></rect><rect x="60" width="15" height="140" rx="6"><animate attributeName="height" begin="0s" dur="1s" values="120;110;100;90;80;70;60;50;40;140;120" calcMode="linear" repeatCount="indefinite"/><animate attributeName="y" begin="0s" dur="1s" values="10;15;20;25;30;35;40;45;50;0;10" calcMode="linear" repeatCount="indefinite"/></rect><rect x="90" y="10" width="15" height="120" rx="6"><animate attributeName="height" begin="0.25s" dur="1s" values="120;110;100;90;80;70;60;50;40;140;120" calcMode="linear" repeatCount="indefinite"/><animate attributeName="y" begin="0.25s" dur="1s" values="10;15;20;25;30;35;40;45;50;0;10" calcMode="linear" repeatCount="indefinite"/></rect><rect x="120" y="10" width="15" height="120" rx="6"><animate attributeName="height" begin="0.5s" dur="1s" values="120;110;100;90;80;70;60;50;40;140;120" calcMode="linear" repeatCount="indefinite"/><animate attributeName="y" begin="0.5s" dur="1s" values="10;15;20;25;30;35;40;45;50;0;10" calcMode="linear" repeatCount="indefinite"/></rect></svg>
                    </div>
                </div>
                <div class="updateprogress-bg modal-backdrop">
                </div>
            </ProgressTemplate>
        </asp:UpdateProgress>

        <main class="container-fluid">

            <!-- Start Content Area -->
            <Rock:Zone Name="Main" runat="server" />

        </main>
    </form>
</body>
</html>
