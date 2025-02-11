#version 330 compatibility

out vec3	vN;

void
main( )
{
	vN = gl_Normal;
	gl_Position = gl_Vertex;

	// Do the vertex and normal matrix transformation in the geometry shader because the GS is going to 
	// generate some completely new vertices and normals which will need to be transformed
}