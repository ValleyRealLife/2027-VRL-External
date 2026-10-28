<%@ Page Language="C#" MasterPageFile="Site.Master" AutoEventWireup="true" Inherits="Rock.Web.UI.RockPage" %>
<%@ Import Namespace="Rock" %>
<%@ Import Namespace="Rock.Model" %>
<%@ Import Namespace="Rock.Web.UI" %>
<%@ Import Namespace="Rock.Web.Cache" %>

<%--
    LANDING LAYOUT

    A section's landing page: the shared page header (SimpleGradStripe by
    default, see below) with the page title and its Page Description, then the
    section's child pages as alternating image cards.
    The cards are an HTML block in the Main zone:

        {% include '~~/Assets/Lava/SubpageList.lava' %}     (Enabled Lava Commands: RockEntity)

    Same container and mobile-first rules as InnerDefault.aspx; only the Feature
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
            <%
                // Page header style: the PageHeaderStyle page attribute.
                //   SimpleGrayStripe   the plain gray band
                //   SimpleGreenStripe  a solid brand-green band
                //   SimpleGradStripe   the gray band with a soft green wash at the right
                //   SideImage          a card with the PageImage overlapping a gray stripe
                //   None               no page header
                // Empty: SimpleGradStripe (a landing page's default); an unknown value: SideImage.
                // The old value SimpleStripe reads as SimpleGradStripe. One markup for
                // every style (Rock's PageTitle control can only appear once); the
                // modifier classes do the rest.
                var headerStyle = ( page.GetAttributeValue( "PageHeaderStyle" ) ?? "" ).Trim().ToLowerInvariant();
                if ( headerStyle == "" ) { headerStyle = "simplegradstripe"; }
                if ( headerStyle == "simplestripe" ) { headerStyle = "simplegradstripe"; }
                if ( headerStyle == "hidden" ) { headerStyle = "none"; }   // Rock's own "None" radio option clears the value (= layout default), so hiding needs a real value
                string headerClass;
                switch ( headerStyle )
                {
                    case "simplegraystripe":  headerClass = "page-head--simple page-head--simple-gray"; break;
                    case "simplegreenstripe": headerClass = "page-head--simple page-head--simple-green"; break;
                    case "simplegradstripe":  headerClass = "page-head--simple page-head--simple-grad"; break;
                    case "none":              headerClass = ""; break;
                    default:                  headerStyle = "sideimage"; headerClass = "page-head--side-image"; break;
                }
                var isSideImage = headerStyle == "sideimage";
                // Page Properties → Show Description (PageDisplayDescription) gates the lead
                var pageDescription = page.PageDisplayDescription ? ( page.Description ?? "" ).Trim() : "";
                var pageImageGuid = ( page.GetAttributeValue( "PageImage" ) ?? "" ).Trim();
            %>
            <% if ( page.PageDisplayTitle && headerStyle != "none" ) { %>
                <header class="page-head <%= headerClass %>">
                    <div class="container">
                        <div class="page-head__card">
                            <div class="page-head__body">
                                <h1 class="page-title-heading"><Rock:PageIcon ID="PageIcon" runat="server" /> <Rock:PageTitle ID="PageTitle" runat="server" /></h1>
                                <% if ( pageDescription != "" ) { %>
                                    <p class="page-head__lead"><%= System.Web.HttpUtility.HtmlEncode( pageDescription ) %></p>
                                <% } %>
                            </div>
                            <% if ( isSideImage ) { %>
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
