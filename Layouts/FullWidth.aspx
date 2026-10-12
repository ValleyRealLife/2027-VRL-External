<%@ Page Language="C#" MasterPageFile="Site.Master" AutoEventWireup="true" Inherits="Rock.Web.UI.RockPage" %>
<%@ Import Namespace="Rock" %>
<%@ Import Namespace="Rock.Model" %>
<%@ Import Namespace="Rock.Web.UI" %>
<%@ Import Namespace="Rock.Web.Cache" %>

<%--
    INTERIOR LAYOUT

    "FullWidth" is Rock's conventional default layout name, but the design has
    no unrestricted full-width page: content sits in the same 1240px container
    (with fluid gutters) as every other section of the site. Only the Feature
    zone is full-bleed, for hero-style blocks.

    Mobile first: one column everywhere; Section B/C/D become thirds at 900px.
    `.page` carries the offset for the fixed header (the homepage hero does
    its own).
--%>

<asp:Content ID="ctMain" ContentPlaceHolderID="main" runat="server">

    <main id="main" class="page">

        <asp:PlaceHolder runat="server">
            <% var page = PageCache.Get( ( ( RockPage ) Page ).PageId ); %>
            <% var showPageTitle = page.PageDisplayTitle; %>
            <% var showPageBreadcrumbs = page.PageDisplayBreadCrumb; %>
            <% if(showPageTitle) { %>
                <header class="page-title-band">
                    <div class="container">
                        <h1 class="page-title-heading"><Rock:PageIcon ID="PageIcon" runat="server" /> <Rock:PageTitle ID="PageTitle" runat="server" /></h1>
                    </div>
                </header>
            <% } %>
            <% if(showPageBreadcrumbs) { %>
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

            <div class="page-grid page-grid--thirds">
                <Rock:Zone Name="Section B" runat="server" />
                <Rock:Zone Name="Section C" runat="server" />
                <Rock:Zone Name="Section D" runat="server" />
            </div>

        </div>
        <!-- End Content Area -->

    </main>

</asp:Content>
