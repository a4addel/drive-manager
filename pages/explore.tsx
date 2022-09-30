import React, { FormEventHandler } from "react";
import Axios, { AxiosError } from "axios";
import { List, Row, Button, Drawer, Typography, notification, Input, Select, Alert, Form, Modal, Menu, Dropdown } from "antd";
import NextLink from "next/link"
import { useRouter } from "next/router";
import { GetServerSideProps } from "next/types";
import { drive_v3 } from "googleapis";
import { FolderTwoTone, UnlockTwoTone, FileFilled, SettingFilled } from "@ant-design/icons"
import { unstable_getServerSession } from "next-auth";


export const getServerSideProps: GetServerSideProps = async (ctx) => {
    const session = await unstable_getServerSession(ctx.req, ctx.res, authOptions);
    if (!session) {
        return {
            redirect: {
                destination: "/api/auth/signin",
                permanent: false
            }
        }
    };


    const id = Array.isArray(ctx.query.id) ? ctx.query.id[0] : ctx.query.id;
    const pageToken = Array.isArray(ctx.query.pageToken) ? ctx.query.pageToken[0] : ctx.query.pageToken;
    if (id && pageToken) throw "Dont send fileId and pageToken together";
    const query: drive_v3.Params$Resource$Files$List = {
        pageSize: 50, fields: `files(mimeType, name, id, webViewLink), nextPageToken`,

    };




    if (id) query.q = queryDrive({
        parents: !!id ? id : "root"
    })
    else if (pageToken) query.pageToken = pageToken


    // SETUP_CLIENT

    try {
        const { data } = await GoogleClass.Drive_Files_list(query, ctx.req, ctx.res);
        return {
            props: {
                data: data
            }
        }
    } catch (error) {

        return {
            props: {
                data: {
                    files: []
                }

            }
        }
    }


}

interface FilesState {
    files: Array<drive_v3.Schema$File>,
    nextPageToken: string | null
}

const Page = ({ data }) => {


    const Router = useRouter()
    const [{ files, nextPageToken }, setParams] = React.useState<FilesState>({
        files: [],
        nextPageToken: ""
    });
    // const dd = useSWR("getFiles", {
    //     fetcher: fetch({ method: "GET", url: `/api/drive/files/list?pageToken=${nextPageToken}` }),


    // });

    React.useEffect(() => {

        if (data?.files?.length === 0) {
            notification["error"]({
                message: "Maybe the file has been deleted or you dont have permission to see it's content"
            });
            setParams({
                files: [],
                nextPageToken: ""
            });
        }
        setParams({
            files: [...data?.files],
            nextPageToken: data?.nextPageToken
        });

    }, [Router])




    return <Row style={{ display: "flex", flexDirection: "column", margin:"0 20px" }}>

        <Typography style={{ width: "100%", textAlign: "center", fontSize: "35px", fontWeight: "bold", flex: 0 }}>Drive Manager</Typography>

        <List

            style={{ width: "100%", maxWidth: "800px", margin: "0 auto" }}
            dataSource={files}
            renderItem={(item: drive_v3.Schema$File) => <FileItem data={item} />}
            bordered
            loadMore={nextPageToken && <Button onClick={getPage}>LoadMore</Button>}
            loading={files.length === 0}
        />

    </Row>


    function getPage() {
        Axios({
            method: "GET",
            url: `/api/drive/files/list?pageToken=${nextPageToken}`
        }).then(({ data }: { data: drive_v3.Schema$FileList }) => {
            setParams({
                files: [...files, ...data.files],
                nextPageToken: data.nextPageToken
            })

        })
    }




};
const FileItem = React.memo(({ data }: { data: drive_v3.Schema$File }) => {

    const isFolder = data.mimeType === "application/vnd.google-apps.folder";
    

    // @ts-ignore
    return <div
        style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            width: "100%",
            maxWidth: "800px",
            margin: "5px 0",
            height: "40px",
            gap: "10px",

        }}
        key={data.id}>
        {
            !isFolder && <Typography style={{ height: "inherit", flex: 1, background: "rgba(0,0,0,0.1)", alignContent: "center", display: "flex", flexDirection: "row", alignItems: "center" }}>
                <strong>
                    <FileFilled style={{ fontSize: "20px", margin: "0 10px" }} />
                    {data.name}
                </strong>
            </Typography>

        }
        {isFolder && <Typography style={{ height: "inherit", flex: 1, background: "rgba(0,0,0,0.1)", alignContent: "center", display: "flex" }}>
            <NextLink href={`/explore?id=${data.id}`}>
                <a style={{ margin: "10px 0" }}>

                    <Typography >
                        <strong><FolderTwoTone style={{ fontSize: "20px", margin: "0 10px" }} />
                            {data.name}
                        </strong>
                    </Typography>

                </a>
            </NextLink>
        </Typography>}




        <Dropdown  autoFocus arrow placement="topLeft" trigger={["click"]} overlay={
            <Menu 
            items={[
                {
                    label: (<a target="_blank" href={data.webViewLink}>Open</a>),
                    key: '0',
                },
                {
                    label: (<EditAccess id={data.id} />),
                    key: '1'
                },
                {
                    label:(<AddAccess id={data.id} />),
                    key: '2'
                },  
                
                
                
            ]}/>
            }>
            <SettingFilled />
        </Dropdown>




    </div>
})



export default Page;



import { useToggle } from "react-use";
import GoogleClass, { queryDrive } from "../Logic/Google";
import { authOptions } from "./api/auth/[...nextauth]";

const EditAccess = React.memo(({ id }: { id: String }) => {
    const [error, setError] = useToggle(false);
    const [permissions, setPermissions] = React.useState<Array<drive_v3.Schema$Permission>>([]);

    const [filterdPermissions, setFilterdPermissions] = React.useState<Array<drive_v3.Schema$PermissionList>>([...permissions]);
    React.useEffect(() => {
        setFilterdPermissions(permissions)
    }, [permissions])
    const [open, toogle] = useToggle(false);
    const [text, setText] = React.useState("");
    React.useEffect(() => {
        const ed = new RegExp(text, "i");
        let items = [];
        permissions.map((item: drive_v3.Schema$Permission) => {


            if (item?.emailAddress?.match(ed)) return items.push({ ...item, filterd: true });
            if (!item?.emailAddress?.match(ed)) return items.push({ ...item, filterd: false });

        })
        setFilterdPermissions(items);
    }, [text])

    React.useEffect(() => {
        if (open) {
            Axios({ method: "GET", url: `/api/drive/permissions/list?id=${id}` })
                .then(({ data }: { data: drive_v3.Schema$PermissionList }) => {
                    setPermissions(data.permissions);
                })
                .catch((ee) => {
                    ee.response.data.errors.map((e) => {
                        notification["error"]({
                            message: e.message
                        })
                    })

                    setError(true)
                })
        } else {
            setPermissions([])

        }
    }, [open])

    return <>
        <Button type="primary" style={{ height: "inherit" }} onClick={() => toogle(true)}> <UnlockTwoTone />Edit Permissons</Button>
        <Drawer
            size="large"
            // style={{ width:"100%", maxWidth: "800px"}}
            width={window?.innerWidth > 900 ? 800 : window?.innerWidth - 100}
            open={open}
            onClose={() => toogle(false)} 
            footer={<Alert closable={false} message="Owner will not be deleted"
                type="error"
                showIcon={true}
                icon={<Button loading={permissions.length === 0 && !error}
                    disabled={permissions.length === 0}
                    danger>Delete All</Button>}
            />}
    


        >


            <List
                style={{ padding: "0 10px" }}
                bordered
                header={<Input value={text} onChange={(e) => setText(e.target.value)} />}
                loading={!error && permissions.length === 0}
            >

                {
                    filterdPermissions
                        .sort((a: drive_v3.Schema$Permission, b: drive_v3.Schema$Permission) =>
                            (a.emailAddress[0].localeCompare(b.emailAddress[0]))
                        )
                        .map((file: drive_v3.Schema$Permission) => <PermissionItem data={file} />)
                }



            </List>

        </Drawer>
    </>
})




const gg = [{
    lable: "Writer",

    value: "writer"
},
{
    lable: "Commenter",

    value: "commenter"
},
{
    lable: "Reader",

    value: "reader"
}]

const AddAccess = React.memo(({ id }: { id: String }) => {
    const [open, toogle] = useToggle(false);
    const [loading, toogleLoading] = useToggle(false);
    const [emailAddress, setEmailAddress] = React.useState("");
    const [role, setRole] = React.useState("reader");
    function CreatePermission(e: React.FormEvent) {
        e.preventDefault()
        toogleLoading(true)
        Axios({
            method: "POST",
            url: `/api/drive/permissions/create?emailAddress=${emailAddress}&role=${role}&fileID=${id}`
        }).then(() => {
            setEmailAddress("");
            setRole("");
            notification["success"]({
                message: "Permission Assigned Succesfully"
            });
            toogle(false)
        }).catch((err: AxiosError) => {
            // @ts-ignore
            err.response.data?.errors.map((error) => {
                notification["error"]({
                    message: error?.message || "Something weng wrong"
                });
            })
        })
    }
    return <>
        <Button style={{ height: "inherit" }} onClick={() => toogle(true)}>Add User</Button>
        <Modal open={open} onCancel={() => toogle(false)} >

            <Form >
                <form onSubmit={CreatePermission}>
                    <Form.Item>
                        <label>User Type</label>
                        <Select defaultValue="reader" value={role} onChange={setRole}>
                            {
                                gg.map((f) => <Select.Option key={f.value} value={f.value}>{f.lable}</Select.Option>)
                            }

                        </Select>
                    </Form.Item>
                    <Form.Item>
                        <label>Email</label>

                        <Input type="email" value={emailAddress} onChange={e => setEmailAddress(e.target.value)} />
                    </Form.Item>
                    <Button onClick={CreatePermission} loading={loading}>Add</Button>
                </form>
            </Form>

            <Typography>set {emailAddress} as {role}</Typography>
        </Modal>
    </>
})













const PermissionItem = React.memo(({ data }: { data: drive_v3.Schema$Permission }) => {
    // @ts-ignore
    return <List.Item hidden={typeof data?.filterd === "boolean" && !data?.filterd}>
        {data.emailAddress}
    </List.Item>

})



