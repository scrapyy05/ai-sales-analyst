import streamlit as st
import requests
import pandas as pd

API_URL = "http://localhost:8000"

st.set_page_config(
    page_title="AI Sales Analyst",
    page_icon="📊",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom Styling for Rich Aesthetics
st.markdown("""
<style>
    .big-font {
        font-size:24px !important;
        font-weight: bold;
        color: #8b5cf6;
    }
    .insight-card {
        background-color: #1e1e2f;
        padding: 20px;
        border-radius: 10px;
        border-left: 5px solid #8b5cf6;
        margin-top: 15px;
        color: white;
    }
    div[data-testid="stMetricValue"] {
        color: #8b5cf6;
    }
</style>
""", unsafe_allow_html=True)

st.title("🚀 AI Sales Analyst Enterprise Platform")
st.markdown("Full-Stack placement portfolio demonstrating FastAPI, PostgreSQL, Pandas, and Google Generative AI.")

# Sidebar for Authentication and Data Upload
with st.sidebar:
    st.header("🔐 Admin Panel")
    
    if "token" not in st.session_state:
        st.session_state["token"] = None

    if not st.session_state["token"]:
        tab1, tab2 = st.tabs(["Login", "Register"])
        
        with tab1:
            with st.form("login_form"):
                st.markdown("Login to your account")
                username = st.text_input("Email", value="test@example.com")
                password = st.text_input("Password", type="password", value="password123")
                submitted = st.form_submit_button("Login")
                
                if submitted:
                    try:
                        res = requests.post(
                            f"{API_URL}/auth/login",
                            data={"username": username, "password": password}
                        )
                        if res.status_code == 200:
                            st.session_state["token"] = res.json()["access_token"]
                            st.success("Logged in successfully!")
                            st.rerun()
                        else:
                            st.error("Invalid credentials!")
                    except Exception as e:
                        st.error(f"Backend offline: {e}")
                        
        with tab2:
            with st.form("register_form"):
                st.markdown("Create a new account")
                new_email = st.text_input("New Email", placeholder="user@company.com")
                new_pass = st.text_input("New Password", type="password")
                reg_submitted = st.form_submit_button("Register")
                
                if reg_submitted:
                    if not new_email or not new_pass:
                        st.warning("Please fill in both fields!")
                    else:
                        try:
                            res = requests.post(
                                f"{API_URL}/auth/register",
                                json={"email": new_email, "password": new_pass}
                            )
                            if res.status_code == 200:
                                st.success("🎉 Account created! Switch to the Login tab to sign in.")
                            else:
                                st.error(res.json().get("detail", res.text))
                        except Exception as e:
                            st.error(f"Backend offline: {e}")
    else:
        st.success("🟢 Authenticated as Admin")
        if st.button("Logout"):
            st.session_state["token"] = None
            st.rerun()
            
        st.divider()
        st.subheader("📂 Bulk Ingestion")
        uploaded_file = st.file_uploader("Upload Sales CSV", type=["csv"])
        if uploaded_file and st.button("Ingest Data"):
            headers = {"Authorization": f"Bearer {st.session_state['token']}"}
            files = {"file": (uploaded_file.name, uploaded_file.getvalue(), "text/csv")}
            
            with st.spinner("Pandas processing..."):
                res = requests.post(f"{API_URL}/upload/csv", headers=headers, files=files)
                if res.status_code == 200:
                    st.success(res.json().get("message", "Uploaded!"))
                else:
                    st.error(res.text)

# Master Navigation Tabs covering 16 / 16 Backend Routes (100% Swagger Coverage)
main_tab1, main_tab2, main_tab3, main_tab4 = st.tabs([
    "💬 AI Sales Analyst", 
    "📊 Executive Analytics KPI", 
    "🗃️ Database Explorer",
    "🛠️ CRUD Management Studio"
])

# ==========================================
# TAB 1: AI TEXT-TO-SQL CHAT (/ask)
# ==========================================
with main_tab1:
    st.subheader("💬 Ask Your Database")
    question = st.text_input("Type your question:", placeholder="e.g., Which customer spent the most on furniture?")

    if st.button("Analyze Data", type="primary"):
        if not question:
            st.warning("Please enter a question!")
        elif not st.session_state.get("token"):
            st.error("🔐 Please log in via the left Admin Panel first to authenticate your session!")
        else:
            with st.spinner("Gemini is writing SQL and generating business insights..."):
                try:
                    headers = {"Authorization": f"Bearer {st.session_state['token']}"}
                    response = requests.post(f"{API_URL}/ask/", json={"question": question}, headers=headers)
                    if response.status_code == 200:
                        data = response.json()
                        results = data.get("results", [])
                        analysis = data.get("analysis")
                        
                        col1, col2 = st.columns([3, 2])
                        
                        with col1:
                            st.markdown("### 📈 Query Results")
                            if results:
                                st.dataframe(pd.DataFrame(results), use_container_width=True)
                            else:
                                st.info("No matching records found in database.")
                                
                        with col2:
                            st.markdown("### 💡 Executive Analysis")
                            if analysis:
                                st.markdown(f"""
                                <div class="insight-card">
                                    <h4>📌 Summary</h4>
                                    <p>{analysis.get('summary')}</p>
                                    <h4>🔍 Key Insight</h4>
                                    <p>{analysis.get('insight')}</p>
                                    <h4>🎯 Recommendation</h4>
                                    <p><b>{analysis.get('recommendation')}</b></p>
                                </div>
                                """, unsafe_allow_html=True)
                            else:
                                st.warning("AI Insight generation skipped or failed.")
                    else:
                        st.error(f"API Error: {response.text}")
                except Exception as e:
                    st.error(f"Could not connect to backend server: {e}")

# ==========================================
# TAB 2: EXECUTIVE ANALYTICS (/analytics/*)
# ==========================================
with main_tab2:
    st.subheader("📈 Key Performance Indicators (KPIs)")
    if not st.session_state.get("token"):
        st.warning("🔐 Please log in via the left Admin Panel to view executive metrics.")
    else:
        headers = {"Authorization": f"Bearer {st.session_state['token']}"}
        
        if st.button("🔄 Refresh Analytics"):
            st.rerun()
            
        try:
            # Fetch Summary KPI
            res_sum = requests.get(f"{API_URL}/analytics/summary", headers=headers)
            if res_sum.status_code == 200:
                kpi = res_sum.json()
                m1, m2, m3, m4 = st.columns(4)
                m1.metric("💰 Total Revenue", f"${float(kpi.get('total_revenue', 0)):,.2f}")
                m2.metric("📦 Total Orders", f"{kpi.get('total_sales', 0)}")
                m3.metric("👥 Active Clients", f"{kpi.get('total_customers', 0)}")
                m4.metric("🏷️ Catalog Items", f"{kpi.get('total_products', 0)}")
            else:
                st.error("Could not load summary metrics.")
                
            st.divider()
            
            chart_col1, chart_col2 = st.columns(2)
            
            with chart_col1:
                st.markdown("#### 🏆 Top Selling Products")
                res_prod = requests.get(f"{API_URL}/analytics/top-products", headers=headers)
                if res_prod.status_code == 200 and res_prod.json():
                    df_prod = pd.DataFrame(res_prod.json())
                    st.dataframe(df_prod, use_container_width=True)
                    if "revenue" in df_prod.columns:
                        st.bar_chart(df_prod.set_index("product")["revenue"])
                        
            with chart_col2:
                st.markdown("#### 💎 Top Spending Customers")
                res_cust = requests.get(f"{API_URL}/analytics/top-customers", headers=headers)
                if res_cust.status_code == 200 and res_cust.json():
                    df_cust = pd.DataFrame(res_cust.json())
                    st.dataframe(df_cust, use_container_width=True)
                    if "revenue" in df_cust.columns:
                        st.bar_chart(df_cust.set_index("customer")["revenue"])
                        
            st.divider()
            st.markdown("#### 🥧 Revenue by Product Category")
            res_cat = requests.get(f"{API_URL}/analytics/revenue-by-category", headers=headers)
            if res_cat.status_code == 200 and res_cat.json():
                df_cat = pd.DataFrame(res_cat.json())
                st.dataframe(df_cat, use_container_width=True)
                if "revenue" in df_cat.columns:
                    st.bar_chart(df_cat.set_index("category")["revenue"])
        except Exception as e:
            st.error(f"Analytics engine offline: {e}")

# ==========================================
# TAB 3: DATABASE EXPLORER (/customers, /products, /sales)
# ==========================================
with main_tab3:
    st.subheader("🗃️ Raw Relational Database Tables")
    if not st.session_state.get("token"):
        st.warning("🔐 Please log in via the left Admin Panel to inspect database records.")
    else:
        headers = {"Authorization": f"Bearer {st.session_state['token']}"}
        
        tbl_choice = st.radio("Select Table to Inspect:", ["Customers", "Products", "Sales"], horizontal=True)
        route_map = {"Customers": "/customers/", "Products": "/products/", "Sales": "/sales/"}
        
        if st.button("Fetch Live Database Records", type="primary"):
            with st.spinner(f"Querying PostgreSQL {tbl_choice} table..."):
                try:
                    res_tbl = requests.get(f"{API_URL}{route_map[tbl_choice]}", headers=headers)
                    if res_tbl.status_code == 200:
                        df_tbl = pd.DataFrame(res_tbl.json())
                        st.success(f"Loaded {len(df_tbl)} records from PostgreSQL")
                        st.dataframe(df_tbl, use_container_width=True)
                    else:
                        st.error(f"Access Denied or Error: {res_tbl.text}")
                except Exception as e:
                    st.error(f"Database Explorer error: {e}")

# ==========================================
# TAB 4: CRUD MANAGEMENT STUDIO
# ==========================================
with main_tab4:
    st.subheader("🛠️ Database Management Studio (CRUD Operations)")
    if not st.session_state.get("token"):
        st.warning("🔐 Please log in via the left Admin Panel to perform database modifications.")
    else:
        headers = {"Authorization": f"Bearer {st.session_state['token']}"}
        crud_action = st.selectbox("Select Operation:", [
            "➕ Add New Customer (POST /customers)", 
            "➕ Add New Product (POST /products)", 
            "➕ Record New Sale (POST /sales)", 
            "✏️ Update Sale Record (PUT /sales/{id})",
            "❌ Delete Sale Record (DELETE /sales/{id})"
        ])
        
        st.divider()
        
        if crud_action == "➕ Add New Customer (POST /customers)":
            with st.form("add_cust"):
                c_name = st.text_input("Customer Name", placeholder="Acme Corp")
                c_email = st.text_input("Contact Email", placeholder="contact@acme.com")
                c_comp = st.text_input("Company Type", placeholder="Enterprise")
                if st.form_submit_button("Create Customer", type="primary"):
                    res = requests.post(f"{API_URL}/customers/", json={"name": c_name, "email": c_email, "company": c_comp}, headers=headers)
                    if res.status_code == 200: st.success("🎉 Customer Created in PostgreSQL!")
                    else: st.error(res.text)
                    
        elif crud_action == "➕ Add New Product (POST /products)":
            with st.form("add_prod"):
                p_name = st.text_input("Product Name", placeholder="Ergonomic Chair")
                p_cat = st.text_input("Category", placeholder="Furniture")
                p_price = st.number_input("Price ($)", min_value=0.01, value=199.99, step=10.0)
                if st.form_submit_button("Create Product", type="primary"):
                    res = requests.post(f"{API_URL}/products/", json={"name": p_name, "category": p_cat, "price": p_price}, headers=headers)
                    if res.status_code == 200: st.success("🎉 Product Catalogued in PostgreSQL!")
                    else: st.error(res.text)
                    
        elif crud_action == "➕ Record New Sale (POST /sales)":
            with st.form("add_sale"):
                s_cid = st.number_input("Customer ID", min_value=1, step=1)
                s_pid = st.number_input("Product ID", min_value=1, step=1)
                s_qty = st.number_input("Quantity Sold", min_value=1, value=5, step=1)
                s_tot = st.number_input("Total Amount ($)", min_value=0.01, value=999.95, step=10.0)
                if st.form_submit_button("Insert Sale Transaction", type="primary"):
                    res = requests.post(f"{API_URL}/sales/", json={"customer_id": s_cid, "product_id": s_pid, "quantity": s_qty, "total_amount": s_tot}, headers=headers)
                    if res.status_code == 200: st.success("🎉 Sale Committed to Database!")
                    else: st.error(res.text)
                    
        elif crud_action == "✏️ Update Sale Record (PUT /sales/{id})":
            with st.form("put_sale"):
                u_sid = st.number_input("Target Sale ID to Update", min_value=1, step=1)
                u_cid = st.number_input("New Customer ID", min_value=1, step=1)
                u_pid = st.number_input("New Product ID", min_value=1, step=1)
                u_qty = st.number_input("New Quantity", min_value=1, step=1)
                u_tot = st.number_input("New Total Amount ($)", min_value=0.01, step=10.0)
                if st.form_submit_button("Execute Sale Update", type="primary"):
                    res = requests.put(f"{API_URL}/sales/{u_sid}", json={"customer_id": u_cid, "product_id": u_pid, "quantity": u_qty, "total_amount": u_tot}, headers=headers)
                    if res.status_code == 200: st.success(f"🎉 Sale #{u_sid} Successfully Updated!")
                    else: st.error(res.text)
                    
        elif crud_action == "❌ Delete Sale Record (DELETE /sales/{id})":
            with st.form("del_sale"):
                d_sid = st.number_input("Target Sale ID to Delete", min_value=1, step=1)
                if st.form_submit_button("Permanently Delete Record", type="primary"):
                    res = requests.delete(f"{API_URL}/sales/{d_sid}", headers=headers)
                    if res.status_code == 200: st.success(f"🗑️ Sale #{d_sid} Removed from Database!")
                    else: st.error(res.text)
