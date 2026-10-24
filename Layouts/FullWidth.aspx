<%@ Page Language="C#" MasterPageFile="Site.Master" AutoEventWireup="true" Inherits="Rock.Web.UI.RockPage" %>
<%@ Import Namespace="Rock" %>
<%@ Import Namespace="Rock.Model" %>
<%@ Import Namespace="Rock.Web.UI" %>
<%@ Import Namespace="Rock.Web.Cache" %>

<%--
    DEPRECATED — replaced by InnerDefault.aspx (identical markup).
    Kept only until every page using it is reassigned in Rock; then delete this
    file and its Layout record.

INTERIOR LAYOUT

    "FullWidth" is Rock's conventional default layout name, but the design has
    no unrestricted full-width page: content sits in the same 1240px container
    (with fluid gutters) as every other section of the site. Only the Feature
    zone is full-bleed, for hero-style blocks.

    Page header: the PageHeaderStyle page attribute picks SideImage (the
    default: a card with the title, description and PageImage overlapping a
    gray stripe, styled like the landing cards) or SimpleStripe (the plain gray
    band). Both show the page Description as a lead line when it's set and
    the page's Show Description property is on.

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
            <%
                // Page header style: the PageHeaderStyle page attribute (SideImage |
                // SimpleStripe); SideImage when empty. One markup for both (Rock's
                // PageTitle control can only appear once); the modifier class does the rest.
                var headerStyleValue = page.GetAttributeValue( "PageHeaderStyle" );
                var headerStyle = string.Equals( ( headerStyleValue ?? "" ).Trim(), "SimpleStripe", StringComparison.OrdinalIgnoreCase ) ? "simple-stripe" : "side-image";
                // Page Properties → Show Description (PageDisplayDescription) gates the lead
                var pageDescription = page.PageDisplayDescription ? ( page.Description ?? "" ).Trim() : "";
                var pageImageGuid = ( page.GetAttributeValue( "PageImage" ) ?? "" ).Trim();
            %>
            <% if(showPageTitle) { %>
                <header class="page-head page-head--<%= headerStyle %>">
                    <div class="container">
                        <div class="page-head__card">
                            <div class="page-head__body">
                                <h1 class="page-title-heading"><Rock:PageIcon ID="PageIcon" runat="server" /> <Rock:PageTitle ID="PageTitle" runat="server" /></h1>
                                <% if ( pageDescription != "" ) { %>
                                    <p class="page-head__lead"><%= System.Web.HttpUtility.HtmlEncode( pageDescription ) %></p>
                                <% } %>
                            </div>
                            <% if ( headerStyle == "side-image" ) { %>
                                <div class="page-head__media<%= pageImageGuid == "" ? " page-head__media--empty" : "" %>">
                                    <% if ( pageImageGuid != "" ) { %>
                                        <img src="/GetImage.ashx?guid=<%= System.Web.HttpUtility.UrlEncode( pageImageGuid ) %>&amp;w=1400&amp;h=900&amp;mode=crop" alt="" />
                                    <% } %>
                                </div>
                            <% } %>
                        </div>
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
