<%@ Page Language="C#" MasterPageFile="Site.Master" AutoEventWireup="true" Inherits="Rock.Web.UI.RockPage" %>
<%@ Import Namespace="Rock" %>
<%@ Import Namespace="Rock.Model" %>
<%@ Import Namespace="Rock.Web.UI" %>
<%@ Import Namespace="Rock.Web.Cache" %>

<%--
    INNER DEFAULT LAYOUT — the default for interior pages.

    Naming: interior layouts are Inner<Purpose>.aspx (InnerDefault, and the
    rare special case such as InnerSermons). Content sits in the same 1240px
    container (with fluid gutters) as every other section of the site — there
    is no unrestricted full-width page. Only the Feature zone is full-bleed,
    for hero-style blocks. (Replaces FullWidth.aspx.)

    Page header: the PageHeaderStyle page attribute picks SideImage (the
    default: a card with the title, description and PageImage overlapping a
    gray stripe, styled like the landing cards), SimpleGrayStripe,
    SimpleGreenStripe, SimpleGradStripe, or None (no header). Every style
    shows the page Description as a lead line when it's set and the page's
    Show Description property is on.

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
                // Page header style: the PageHeaderStyle page attribute.
                //   SimpleGrayStripe   the plain gray band
                //   SimpleGreenStripe  a solid brand-green band
                //   SimpleGradStripe   the gray band with a soft green wash at the right
                //   SideImage          a card with the PageImage overlapping a gray stripe
                //   None               no page header
                // Empty (or an unknown value): SideImage.
                // The old value SimpleStripe reads as SimpleGradStripe. One markup for
                // every style (Rock's PageTitle control can only appear once); the
                // modifier classes do the rest.
                var headerStyle = ( page.GetAttributeValue( "PageHeaderStyle" ) ?? "" ).Trim().ToLowerInvariant();
                if ( headerStyle == "" ) { headerStyle = "sideimage"; }
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
                // A block can set this request's header photo (an event's photo,
                // Assets/Lava/EventDetail.lava) with Rock's Lava filter:
                //   {{ url | AddMetaTagToHead:'name','vrl:page-image' }}
                // It wins over the PageImage attribute.
                var pageImageUrl = "";
                foreach ( System.Web.UI.Control headControl in Page.Header.Controls )
                {
                    var headMeta = headControl as System.Web.UI.HtmlControls.HtmlMeta;
                    if ( headMeta != null && string.Equals( headMeta.Name, "vrl:page-image", System.StringComparison.OrdinalIgnoreCase ) )
                    {
                        pageImageUrl = ( headMeta.Content ?? "" ).Trim();
                        break;
                    }
                }
                if ( pageImageUrl == "" && pageImageGuid != "" )
                {
                    pageImageUrl = "/GetImage.ashx?guid=" + System.Web.HttpUtility.UrlEncode( pageImageGuid ) + "&w=1400&h=900&mode=crop";
                }
            %>
            <% if ( showPageTitle && headerStyle != "none" ) { %>
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
                                <div class="page-head__media<%= pageImageUrl == "" ? " page-head__media--empty" : "" %>">
                                    <% if ( pageImageUrl != "" ) { %>
                                        <img src="<%= System.Web.HttpUtility.HtmlAttributeEncode( pageImageUrl ) %>" alt="" />
                                    <% } %>
                                </div>
                            <% } %>
                        </div>
                    </div>
                </header>
            <% } %>
            <% if(showPageBreadcrumbs) { %>
                <%
                    // A block that retitles the page (Workflow Entry with
                    // ?WorkflowTypeId=, …) leaves the last crumb on the page's
                    // own name ("Workflow Entry"). When that crumb is the
                    // page's own, show the page title the visitor sees instead.
                    // ((RockPage)this).PageTitle: the page's title text. A bare
                    // PageTitle is the <Rock:PageTitle ID="PageTitle"> control
                    // above, which doesn't compile here, and when a layout
                    // fails to compile Rock silently falls back to the Rock
                    // theme's layout.
                    var titleText = ( ( RockPage ) this ).PageTitle;
                    var lastCrumb = BreadCrumbs != null && BreadCrumbs.Count > 0 ? BreadCrumbs[BreadCrumbs.Count - 1] : null;
                    if ( lastCrumb != null && lastCrumb.Name == page.BreadCrumbText
                        && !string.IsNullOrWhiteSpace( titleText ) && titleText != lastCrumb.Name )
                    {
                        lastCrumb.Name = titleText;
                    }
                %>
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
