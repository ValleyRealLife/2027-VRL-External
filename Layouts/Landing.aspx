<%@ Page Language="C#" MasterPageFile="Site.Master" AutoEventWireup="true" Inherits="Rock.Web.UI.RockPage" %>
<%@ Import Namespace="Rock" %>
<%@ Import Namespace="Rock.Model" %>
<%@ Import Namespace="Rock.Web.UI" %>
<%@ Import Namespace="Rock.Web.Cache" %>

<%--
    LANDING LAYOUT

    A section's landing page: a header band with the page title and its Page
    Description, then the section's child pages as alternating image cards.
    The cards are an HTML block in the Main zone:

        {% include '~~/Assets/Lava/SubpageList.lava' %}     (Enabled Lava Commands: RockEntity)

    Same container and mobile-first rules as FullWidth.aspx; only the Feature
    zone is full-bleed.

    Rule for this file: a Rock zone may never sit inside a control that contains
    <% %> code blocks (Rock inserts controls into the zone's parent at init and
    ASP.NET refuses). The PlaceHolder below holds the code blocks; every zone
    is outside it.
--%>

<asp:Content ID="ctMain" ContentPlaceHolderID="main" runat="server">

    <main id="main" class="page page--landing">

        <asp:PlaceHolder runat="server">
            <% var page = PageCache.Get( ( ( RockPage ) Page ).PageId ); %>
            <% if ( page.PageDisplayTitle ) { %>
                <header class="page-title-band landing-band">
                    <div class="container">
                        <h1 class="page-title-heading"><Rock:PageTitle ID="PageTitle" runat="server" /></h1>
                        <% if ( !string.IsNullOrWhiteSpace( page.Description ) ) { %>
                            <p class="landing-band__lead"><%= System.Web.HttpUtility.HtmlEncode( page.Description ) %></p>
                        <% } %>
                    </div>
                </header>
            <% } %>
            <% if ( page.PageDisplayBreadCrumb ) { %>
                <div class="container breadcrumb-container">
                    <Rock:PageBreadCrumbs ID="PageBreadCrumbs" runat="server" />
                </div>
            <% } %>
        </asp:PlaceHolder>

        <%-- Full-bleed: blocks in this zone span edge to edge. --%>
        <section class="page-feature">
            <Rock:Zone Name="Feature" runat="server" />
        </section>

        <!-- Start Content Area -->
        <div class="container page-content">

            <!-- Ajax Error -->
            <div class="alert alert-danger ajax-error" style="display:none">
                <p><strong>Error</strong></p>
                <span class="ajax-error-message"></span>
            </div>

            <Rock:Zone Name="Main" runat="server" />

            <Rock:Zone Name="Section A" runat="server" />

        </div>
        <!-- End Content Area -->

    </main>

</asp:Content>
