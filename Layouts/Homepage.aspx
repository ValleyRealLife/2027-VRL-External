<%@ Page Language="C#" MasterPageFile="Site.Master" AutoEventWireup="true" Inherits="Rock.Web.UI.RockPage" %>
<%@ Import Namespace="Rock" %>
<%@ Import Namespace="Rock.Model" %>
<%@ Import Namespace="Rock.Web.UI" %>
<%@ Import Namespace="Rock.Web.Cache" %>

<%--
    HOMEPAGE LAYOUT

    The utility bar, header and footer come from Site.Master. This layout adds
    only the Main zone and the homepage's scripts; the content is an HTML block
    in the Main zone:

        {% include '~~/Assets/Lava/Home.lava' %}

    No full-width container here: the homepage sections are edge-to-edge bands
    that set their own containers, and the hero clears the fixed header itself.

    Rule for this file: a Rock zone may never sit inside a control that contains
    <% %> code blocks (Rock inserts controls into the zone's parent at init and
    ASP.NET refuses). Keep the zone a direct child of the Content control.
--%>

<asp:Content ID="ctHead" ContentPlaceHolderID="head" runat="server">
    <%--
        GSAP + ScrollTrigger drive the scroll choreography and are only needed
        here, so they load from this layout rather than Site.Master. home.js is
        deferred after them, so it can rely on them being defined.
    --%>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js" defer></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js" defer></script>
    <script defer src="<%# ResolveRockUrl("~~/Assets/Scripts/home.js", true) %>"></script>
</asp:Content>

<asp:Content ID="ctMain" ContentPlaceHolderID="main" runat="server">

    <main id="main" class="home">

        <!-- Ajax Error -->
        <div class="alert alert-danger ajax-error" style="display:none">
            <p><strong>Error</strong></p>
            <span class="ajax-error-message"></span>
        </div>

        <Rock:Zone Name="Main" runat="server" />

    </main>

    <script>
        /* Safety net: if GSAP or home.js failed to load, hand the stage back to
           the static hero + grid so nothing is left mid-animation. */
        window.addEventListener('load', function () {
            if (!window.gsap || !window.ScrollTrigger || !window.VRLHome) {
                document.documentElement.classList.add('stage-static');
            }
        });
    </script>

</asp:Content>
